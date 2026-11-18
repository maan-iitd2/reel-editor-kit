"""Local web UI for roughcut. `python -m roughcut.ui` then open the printed URL.

Standard library only — `http.server` plus one HTML file. No framework, no npm,
no build step, and nothing new to install on a machine where installing the
wrong package breaks transcription.

Two things here are less trivial than they look:

* **Range requests.** Browsers scrub video by asking for byte ranges. The stdlib
  handler answers 200 with the whole file, which makes a <video> element refuse
  to seek. `_send_range` implements 206 properly, and without it the scrub bar
  does not work at all.
* **Long jobs run on a thread.** Analyze/build/caption take minutes; doing them
  inline would block the single-threaded server and freeze the page. They append
  to a log the page polls.
"""
import json
import mimetypes
import re
import threading
import traceback
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path.cwd()
CACHE = ROOT / "_ui_cache"
PORT = 8000

_log: list = []
_busy = {"job": None}
_lock = threading.Lock()


def log(msg: str) -> None:
    with _lock:
        _log.append(str(msg))
    print(msg, flush=True)


def _job(name: str, fn) -> bool:
    """Run fn on a thread unless one is already running. -> accepted?

    The slot is claimed under the lock here, in the request thread. Setting it
    inside the worker instead leaves a window the width of thread startup, and
    a double-clicked Build then starts two ffmpeg runs writing one file.
    """
    with _lock:
        running = _busy["job"]
        if not running:
            _busy["job"] = name
    # log() takes the same lock, so it must be called outside the block above —
    # threading.Lock is not reentrant and this deadlocks if you inline it.
    if running:
        log(f"busy with {running}, ignoring {name}")
        return False

    def run():
        try:
            fn()
            log(f"{name} done")
        except SystemExit as e:
            log(f"{name} refused: {e}")
        except Exception:
            log(f"{name} FAILED:\n{traceback.format_exc()}")
        finally:
            with _lock:
                _busy["job"] = None

    threading.Thread(target=run, daemon=True).start()
    return True


# ── jobs ─────────────────────────────────────────────────────────────────────

def do_analyze(takes="takes"):
    from .probe import probe_all, filmstrip
    from .scenes import detect_cuts
    from .clipsearch import build_index

    log("probing takes (transcribe + frames)…")
    result = probe_all(takes, ".")
    frames = []
    for c in result["clips"]:
        log(f"  filmstrip {c['file']}")
        filmstrip(c["path"], CACHE / "strip" / c["file"].replace(".", "_"),
                  duration=c["duration"])
        if c.get("has_video"):
            log(f"  detecting cuts in {c['file']}")
            c["cuts"] = detect_cuts(c["path"])
        for i, fp in enumerate(c.get("frames", []), 1):
            frames.append({"path": fp, "file": c["file"],
                           "t": round(c["duration"] * i / (len(c["frames"]) + 1), 2)})
    Path("clips.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    if frames:
        log(f"embedding {len(frames)} frames for search (CPU, ~0.5s each)…")
        build_index(frames, "clip_index.json")
    log("analyze complete")


def do_direct(intent: str, target: float, music: str = ""):
    """The only job that leaves this machine. Provider comes from .env."""
    from .director import describe, direct
    from .shotplan import render_plan
    clips = json.loads(Path("clips.json").read_text(encoding="utf-8"))["clips"]
    if not clips:
        raise SystemExit("no clips — run Analyze first")
    log(f"director → {describe()}")
    log(f"asking for a {target:g}s cut from {len(clips)} takes…")
    plan = direct(clips, intent, target, music=music)
    if not plan.shots:
        raise SystemExit("the model returned no shots; try a more specific intent")
    Path("shotplan.md").write_text(render_plan(plan), encoding="utf-8")
    log(f"  {len(plan.shots)} shots, {plan.total:.1f}s")
    log(f"  why: {plan.why[:200]}")


def do_build(plan="shotplan.md", takes="takes", out="master.mp4"):
    from .build import build_video
    from .shotplan import parse_plan
    log("building…")
    log(str(build_video(parse_plan(Path(plan).read_text(encoding="utf-8")), takes, out)))


def do_caption(video="master.mp4", out="final.mp4"):
    from .caption import caption_file
    log("re-transcribing and burning captions…")
    log(str(caption_file(video, out)))


def _director_label() -> str:
    """Shown in the UI so which provider you're about to pay is never a guess."""
    try:
        from .director import describe
        return describe()
    except Exception as e:
        return f"unavailable: {e}"


# ── server ───────────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass                                  # the job log is the useful one

    # -- helpers --
    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _safe(self, rel: str):
        """Resolve under ROOT or refuse. Stops ../.. escaping the project."""
        p = (ROOT / unquote(rel)).resolve()
        # is_relative_to, not startswith: a sibling directory whose name merely
        # extends the root (roughcut-evil vs roughcut) passes a prefix test.
        if not p.is_relative_to(ROOT.resolve()) or not p.is_file():
            return None
        return p

    def _send_range(self, path: Path):
        """206 partial content. Without this a <video> element cannot seek."""
        size = path.stat().st_size
        ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        rng = self.headers.get("Range")
        start, end = 0, size - 1
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            if m:
                if m.group(1):
                    start = int(m.group(1))
                if m.group(2):
                    end = int(m.group(2))
                end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return
        length = end - start + 1
        self.send_response(206 if rng else 200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        if rng:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        with open(path, "rb") as f:
            f.seek(start)
            left = length
            while left > 0:
                chunk = f.read(min(65536, left))
                if not chunk:
                    break
                self.wfile.write(chunk)
                left -= len(chunk)

    def handle_one_request(self):
        """Seeking a <video> aborts the transfer in flight; that is playback
        working, not a fault. socketserver logs a full traceback per abort,
        which buries the build log. Both the interrupted write and the
        keep-alive read of the next request raise, so guard the whole request
        rather than the write alone.
        """
        try:
            super().handle_one_request()
        except (ConnectionError, BrokenPipeError):
            self.close_connection = True

    def _local(self) -> bool:
        """Reject cross-origin and DNS-rebinding callers.

        A cross-origin form post with enctype=text/plain can spell valid JSON,
        so "it only accepts JSON" is not protection: any page open in the same
        browser could otherwise overwrite the shot plan and start a build.
        """
        host = (self.headers.get("Host") or "").split(":")[0]
        if host not in ("127.0.0.1", "localhost", "[::1]", "::1"):
            return False
        origin = self.headers.get("Origin")
        if origin:
            from urllib.parse import urlparse as _up
            if _up(origin).hostname not in ("127.0.0.1", "localhost", "::1"):
                return False
        return True

    # -- routes --
    def do_GET(self):
        if not self._local():
            self.send_error(403)
            return
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path in ("/", "/index.html"):
            page = (Path(__file__).parent / "ui.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(page)))
            self.end_headers()
            self.wfile.write(page)
        elif u.path == "/api/state":
            clips = json.loads(Path("clips.json").read_text(encoding="utf-8")) \
                if Path("clips.json").exists() else {"clips": [], "failed": []}
            for c in clips.get("clips", []):
                # Key on the full filename: take1.mov and take1.mp4 share a
                # stem, and would then overwrite each other's thumbnails.
                stem = c["file"].replace(".", "_")
                d = CACHE / "strip" / stem
                c["strip"] = [f"/file/_ui_cache/strip/{stem}/{p.name}"
                              for p in sorted(d.glob("*.jpg"))] if d.exists() else []
                # clips.json stores paths as given, which may be relative.
                # Resolve before comparing, or relative_to raises on every take.
                try:
                    rel = Path(c["path"]).resolve().relative_to(ROOT.resolve())
                    c["src"] = "/file/" + rel.as_posix()
                except ValueError:
                    # Outside the project: _safe would refuse it anyway. Takes
                    # must live under the project directory to be previewable.
                    c["src"] = ""
            with _lock:
                tail = _log[-200:]
            self._json({"clips": clips.get("clips", []),
                        "failed": clips.get("failed", []),
                        "plan": Path("shotplan.md").read_text(encoding="utf-8")
                        if Path("shotplan.md").exists() else "",
                        "music": [p.name for p in sorted(Path("music").glob("*"))
                                  if p.suffix.lower() in (".mp3", ".wav", ".m4a", ".flac", ".ogg")]
                        if Path("music").exists() else [],
                        "busy": _busy["job"], "log": tail,
                        "director": _director_label(),
                        "plan_mtime": Path("shotplan.md").stat().st_mtime
                        if Path("shotplan.md").exists() else 0,
                        "outputs": [n for n in ("master.mp4", "final.mp4")
                                    if Path(n).exists()]})
        elif u.path == "/api/search":
            try:
                from .clipsearch import search
                idx = json.loads(Path("clip_index.json").read_text(encoding="utf-8"))
                hits = search(q.get("q", [""])[0], idx, top=12)
                for h in hits:
                    h["url"] = "/file/" + Path(h["path"]).as_posix()
                self._json({"hits": hits})
            except FileNotFoundError:
                self._json({"hits": [], "error": "run Analyze first"})
            except Exception as e:
                self._json({"hits": [], "error": str(e)})
        elif u.path.startswith("/file/"):
            p = self._safe(u.path[len("/file/"):])
            if not p:
                self.send_error(404)
                return
            self._send_range(p)
        else:
            self.send_error(404)

    def do_POST(self):
        if not self._local():
            self.send_error(403)
            return
        u = urlparse(self.path)
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or "{}") if n else {}
        if u.path == "/api/plan":
            Path("shotplan.md").write_text(body.get("text", ""), encoding="utf-8")
            log("shot plan saved")
            self._json({"ok": True})
        elif u.path == "/api/analyze":
            self._json({"started": _job("analyze", lambda: do_analyze(body.get("takes", "takes")))})
        elif u.path == "/api/direct":
            intent = (body.get("intent") or "").strip()
            if not intent:
                self._json({"started": False, "error": "describe what you want first"})
                return
            self._json({"started": _job("director", lambda: do_direct(
                intent, float(body.get("target") or 30), body.get("music", "")))})
        elif u.path == "/api/build":
            self._json({"started": _job("build", do_build)})
        elif u.path == "/api/caption":
            self._json({"started": _job("caption", do_caption)})
        else:
            self.send_error(404)


def serve(port: int = PORT, open_browser: bool = True):
    CACHE.mkdir(exist_ok=True)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    print(f"roughcut UI on {url}   (ctrl-c to stop)")
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


def _selfcheck() -> None:
    # _safe must refuse traversal and accept a real file under ROOT.
    h = Handler.__new__(Handler)
    assert h._safe("../../etc/passwd") is None
    assert h._safe("does_not_exist_xyz") is None
    probe = Path("roughcut/ui.py")
    assert probe.exists() and h._safe("roughcut/ui.py") is not None

    # The Range regex must parse every form a browser actually sends.
    for rng, want in (("bytes=0-499", ("0", "499")), ("bytes=500-", ("500", "")),
                      ("bytes=-200", ("", "200"))):
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        assert m and m.groups() == want, (rng, m and m.groups())

    # _job must refuse a second job while one is running, and clear afterwards.
    done = threading.Event()
    _busy["job"] = None
    assert _job("t1", lambda: done.wait(0.4)) is True
    assert _job("t2", lambda: None) is False, "second job must be refused"
    done.set()
    for _ in range(50):
        if _busy["job"] is None:
            break
        threading.Event().wait(0.05)
    assert _busy["job"] is None, "busy flag must clear when the job ends"

    # A failing job must clear the flag too, or the UI wedges forever.
    def boom():
        raise RuntimeError("intentional")
    assert _job("t3", boom) is True
    for _ in range(50):
        if _busy["job"] is None:
            break
        threading.Event().wait(0.05)
    assert _busy["job"] is None, "busy flag must clear after a failure"
    assert any("FAILED" in m for m in _log), _log[-3:]

    # A client vanishing mid-transfer — every <video> seek does this — must not
    # escape the handler, or socketserver prints a traceback over the build log.
    import http.server
    real = http.server.BaseHTTPRequestHandler.handle_one_request

    def aborted(self):
        raise ConnectionAbortedError(10053, "aborted by the host machine")

    h2 = Handler.__new__(Handler)
    h2.close_connection = False
    http.server.BaseHTTPRequestHandler.handle_one_request = aborted
    try:
        h2.handle_one_request()          # must swallow, not raise
    finally:
        http.server.BaseHTTPRequestHandler.handle_one_request = real
    assert h2.close_connection is True, "an aborted client must close the socket"

    print("ui selfcheck OK")


if __name__ == "__main__":
    import sys
    if "--selfcheck" in sys.argv:
        _selfcheck()
    else:
        port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else PORT
        serve(port, open_browser="--no-open" not in sys.argv)
