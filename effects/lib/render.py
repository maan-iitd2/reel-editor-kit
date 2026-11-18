"""Render any seek(t) film in this project to MP4. Run with C:\\Python314\\python.exe.
  probe  <film.html> t1 t2 ...                         -> <film dir>/out/probe.png (one still per time, 4 per row)
  render <film.html> --T <sec> [--audio a.wav] [--chunks 3] [--sub 2] [--w 1080 --h 1920]  -> <film dir>/out/final.mp4
  check  <film.html>                                    -> out/contact.png (1 fps) + flash/pop scan
Serves the whole "Content Creation" folder over localhost, so films can load ../../lab/shark/... plates and ES modules.
The film must set window.ready = true after loading and expose async window.seek(t).
"""
import asyncio, functools, http.server, shutil, subprocess, sys, threading
from pathlib import Path
import numpy as np
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]          # .../Content Creation
ARGS = ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--font-render-hinting=none", "--force-color-profile=srgb"]
FPS = 30


def serve():
    h = type("Q", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(h, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


async def open_page(p, film, w, h, port):
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={"width": w, "height": h})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    await pg.goto(f"http://127.0.0.1:{port}/{film.relative_to(ROOT).as_posix()}")
    await pg.wait_for_function("window.ready === true", timeout=180000)
    await pg.add_style_tag(content="*,*::before,*::after{transition:none!important;animation:none!important}")
    return b, pg, errs


async def shot(pg, t, path, fmt="jpeg"):
    await pg.evaluate(f"window.seek({t})")
    await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    await pg.screenshot(path=str(path), type=fmt, **({"quality": 94} if fmt == "jpeg" else {}))


async def probe(film, times, w, h, port):
    d = film.parent / "out" / "probe"; shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, film, w, h, port)
        for i, t in enumerate(times): await shot(pg, t, d / f"p_{i:03d}.png", "png")
        await b.close()
    print("page errors:", errs[:5] or "none")
    cols = min(4, len(times)); rows = -(-len(times) // cols)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(d / "p_%03d.png"), "-vf",
                    f"scale=360:-1,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='%{{frame_num}}':start_number=0:x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,tile={cols}x{rows}:padding=6:color=white",
                    "-frames:v", "1", str(film.parent / "out" / "probe.png")], check=True)
    print("probe ->", film.parent / "out" / "probe.png", "(numbers = order of the times given)")


async def chunk(p, film, w, h, port, lo, hi, sub, d, T):
    b, pg, errs = await open_page(p, film, w, h, port)
    offs = [(j - (sub - 1) / 2) * 0.5 / (FPS * sub) for j in range(sub)]
    c = 0
    for i in range(lo, hi):
        for o in offs:
            await shot(pg, min(T - 1e-3, max(0.0, i / FPS + o)), d / f"s_{c:06d}.jpg"); c += 1
        if (i - lo) % 150 == 0: print(f"[{lo}] {i - lo}/{hi - lo}", flush=True)
    await b.close()
    return errs


async def render(film, T, audio, chunks, sub, w, h, port):
    out = film.parent / "out"; out.mkdir(exist_ok=True)
    N = int(round(T * FPS)); bounds = [(k * N // chunks, (k + 1) * N // chunks) for k in range(chunks)]
    dirs = [film.parent / "sub" / str(k) for k in range(chunks)]
    for d in dirs: shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
    async with async_playwright() as p:
        errs = await asyncio.gather(*[chunk(p, film, w, h, port, lo, hi, sub, d, T) for (lo, hi), d in zip(bounds, dirs)])
    print("page errors:", [e[:3] for e in errs if e] or "none")
    parts = []
    for k, d in enumerate(dirs):
        part = film.parent / "sub" / f"part{k}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS * sub), "-i", str(d / "s_%06d.jpg"), "-vf",
                        f"tmix=frames={sub},select='eq(mod(n\\,{sub})\\,{sub - 1})',setpts=N/{FPS}/TB", "-r", str(FPS),
                        "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", str(part)], check=True)
        parts.append(part)
    lst = film.parent / "sub" / "list.txt"; lst.write_text("".join(f"file '{q.as_posix()}'\n" for q in parts))
    silent = out / "silent.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)], check=True)
    final = out / "final.mp4"
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(silent)] + (["-i", str(audio)] if audio else []) + [
        "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p", "-color_range", "tv", "-colorspace", "bt709",
        "-c:v", "libx264", "-crf", "16"] + (["-c:a", "aac", "-b:a", "256k"] if audio else []) + ["-t", f"{T:.3f}", "-movflags", "+faststart", str(final)]
    subprocess.run(cmd, check=True)
    shutil.rmtree(film.parent / "sub", ignore_errors=True)
    nf = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames",
                         "-of", "csv=p=0", str(final)], capture_output=True, text=True).stdout.strip()
    print("final ->", final, "| frames", nf, "expected", N)


def check(film):
    f = film.parent / "out" / "final.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-vf", "fps=1,scale=216:-1,tile=8x8:padding=4:color=white",
                    "-frames:v", "1", str(film.parent / "out" / "contact.png")], check=True)
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(f), "-vf", "scale=90:160,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 160, 90).astype(np.float32)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    pops = [round((i + 1) / FPS, 2) for i in range(1, len(d) - 1) if d[i] > 3 * max(d[i - 1], d[i + 1], .3) and d[i] > 2]
    flash = [round(i / FPS, 2) for i in range(1, len(fr) - 1) if np.abs(fr[i - 1] - fr[i + 1]).mean() < 1.5 and np.abs(fr[i] - fr[i - 1]).mean() > 8]
    print("contact ->", film.parent / "out" / "contact.png", "| pops (hard cuts are expected):", pops or "none", "| one-frame flashes:", flash or "none")


if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if a and a[0] == "check": check(Path(a[1]).resolve()); sys.exit()
    if len(a) < 2: print(__doc__); sys.exit()
    film = Path(a[1]).resolve(); w, h = int(opt("--w", 1080)), int(opt("--h", 1920)); port = serve()
    if a[0] == "probe": asyncio.run(probe(film, [float(x) for x in a[2:] if not x.startswith("--") and x.replace('.', '', 1).isdigit()], w, h, port))
    elif a[0] == "render": asyncio.run(render(film, float(opt("--T")), opt("--audio") and Path(opt("--audio")).resolve(), int(opt("--chunks", 3)), int(opt("--sub", 2)), w, h, port))
