"""Gather everything Claude needs to choose clips: metadata, frames, words.

Frames are downscaled to 512px wide. Three per clip across ten clips is thirty
images into a conversation; full resolution would be wasteful and adds nothing
to a "is this in focus, is the hand in frame" judgement.
"""
import json
import re
import subprocess
from pathlib import Path

from .stt import transcribe
from .triage import suggest_window, retake_pairs

VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi", ".m4v"}
N_FRAMES = 3
FRAME_WIDTH = 512


def require_ffmpeg() -> None:
    for exe in ("ffmpeg", "ffprobe"):
        try:
            subprocess.run([exe, "-version"], capture_output=True, check=True)
        except (OSError, subprocess.CalledProcessError):
            raise SystemExit(f"{exe} not found on PATH. Install it before running roughcut.")


def probe_one(path) -> dict:
    path = Path(path)
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, check=True)
    data = json.loads(out.stdout)
    streams = data.get("streams", [])
    video = next((s for s in streams if s["codec_type"] == "video"), None)
    audio = next((s for s in streams if s["codec_type"] == "audio"), None)
    # Some containers report r_frame_rate as "0/0", and some omit duration
    # entirely; neither may take down a ten-clip batch.
    fps = 0.0
    if video:
        num, _, den = str(video.get("r_frame_rate", "0/1")).partition("/")
        try:
            fps = round(float(num) / float(den), 3) if float(den or 0) else 0.0
        except ValueError:
            fps = 0.0
    dur = data.get("format", {}).get("duration")
    if dur is None and video:
        dur = video.get("duration")
    return {
        "file": path.name,
        "path": str(path),
        "duration": float(dur or 0.0),
        "width": int(video["width"]) if video else 0,
        "height": int(video["height"]) if video else 0,
        "fps": fps,
        "has_video": video is not None,
        "has_audio": audio is not None,
    }


def sample_frames(path, dest, n: int = N_FRAMES, duration=None) -> list:
    path, dest = Path(path), Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    if duration is None:
        duration = probe_one(path)["duration"]
    if duration <= 0:
        return []
    shots = []
    for i in range(n):
        # Evenly spaced, avoiding the very first and last frames which are
        # often a black lead-in or the camera being touched.
        t = duration * (i + 1) / (n + 1)
        jpg = dest / f"{path.stem}_{i + 1}.jpg"
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(path),
             "-frames:v", "1", "-vf", f"scale={FRAME_WIDTH}:-2", str(jpg)],
            check=True)
        shots.append(jpg)
    return shots


def filmstrip(path, dest, count: int = 40, height: int = 72, duration=None) -> list:
    """Evenly spaced thumbnails for the UI's scrub bar. Cached by mtime.

    One ffmpeg pass with an fps filter, not `count` separate seeks — seeking is
    the expensive part and this turns N decodes into one.
    """
    path, dest = Path(path), Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    stamp = dest / ".mtime"
    fresh = stamp.exists() and stamp.read_text() == str(path.stat().st_mtime)
    existing = sorted(dest.glob("*.jpg"))
    if fresh and existing:
        return existing
    for old in existing:
        old.unlink()
    if duration is None:
        duration = probe_one(path)["duration"]
    if duration <= 0:
        return []
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(path),
         "-vf", f"fps={count / duration:.6f},scale=-2:{height}",
         "-frames:v", str(count), str(dest / "%03d.jpg")],
        check=True)
    stamp.write_text(str(path.stat().st_mtime))
    return sorted(dest.glob("*.jpg"))


def probe_all(takes_dir, out_dir, n_frames: int = N_FRAMES) -> dict:
    require_ffmpeg()
    takes_dir, out_dir = Path(takes_dir), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    clips, failed = [], []
    for f in sorted(takes_dir.iterdir()):
        if f.suffix.lower() not in VIDEO_EXT:
            continue
        try:
            info = probe_one(f)
            info["frames"] = [str(p) for p in sample_frames(
                f, out_dir / "frames", n_frames, info["duration"])] if info["has_video"] else []
            if info["has_audio"]:
                words = transcribe(f)
                info["text"] = " ".join(w["word"] for w in words)
                info["words"] = words
                lo, hi = suggest_window(words)
                info["suggested_in"], info["suggested_out"] = round(lo, 2), round(hi, 2)
                # Rule 3 of triage: surface likely retakes so shot selection can
                # see them. Sentence split is deliberately crude — retake_pairs
                # only compares neighbours, so exact boundaries do not matter.
                sentences = [s.strip() for s in re.split(r"[.?!]+", info["text"]) if s.strip()]
                info["retakes"] = [
                    {"drop": sentences[a], "keep": sentences[b]}
                    for a, b in retake_pairs(sentences)
                ]
            else:
                # Usable as b-roll; simply not selectable on what was said.
                info["text"], info["words"] = "", []
                info["retakes"] = []
            clips.append(info)
            print(f"  probed {f.name}: {info['duration']:.1f}s, {len(info['words'])} words")
        except Exception as e:
            # One bad file must not discard the transcription already done on the
            # others — transcription is by far the expensive step here.
            failed.append({"file": f.name, "error": str(e)})
            print(f"  FAILED {f.name}: {e}")
    result = {"takes_dir": str(takes_dir), "clips": clips, "failed": failed}
    (out_dir / "clips.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


if __name__ == "__main__":
    import sys
    takes = sys.argv[1] if len(sys.argv) > 1 else "takes"
    out = sys.argv[2] if len(sys.argv) > 2 else "."
    r = probe_all(takes, out)
    print(f"{len(r['clips'])} clips -> {Path(out) / 'clips.json'}")
