"""Render a shot plan with ffmpeg.

Multi-pass through temp files rather than one filter_complex. For 30-second
videos the extra encode costs seconds, and a failing pass names the shot that
broke instead of dumping an unreadable filter graph.
"""
import subprocess
from pathlib import Path

from .probe import probe_one
from .shotplan import validate

W, H = 1920, 1080


def zoom_filter(zoom: float, w: int = W, h: int = H) -> str:
    """Static zoom: scale up, crop back to frame, centred.

    zoompan is for animated moves and needs keyframes. A static zoom is scale
    plus crop, which is simpler and exactly what hides a hard cut.
    """
    if zoom <= 1.0:
        return f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
    zw, zh = int(w * zoom) // 2 * 2, int(h * zoom) // 2 * 2
    return (f"scale={zw}:{zh}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h}:(iw-{w})/2:(ih-{h})/2")


def _has_audio(path) -> bool:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True)
    return bool(out.stdout.strip())


def cut_shot(shot, takes_dir, dest, w: int = W, h: int = H) -> Path:
    """Trim one shot, apply its zoom, normalise to a common format."""
    src = Path(takes_dir) / shot.clip
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-ss", f"{shot.start:.3f}", "-to", f"{shot.end:.3f}", "-i", str(src)]
    if not _has_audio(src):
        # Every segment must carry an audio stream or the concat demuxer drops
        # and desyncs audio across the join — a silently wrong master rather
        # than a failure. b-roll legitimately has no audio (probe.py:has_audio).
        cmd += ["-f", "lavfi", "-t", f"{shot.duration:.3f}",
                "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
                "-map", "0:v", "-map", "1:a"]
    cmd += ["-vf", zoom_filter(shot.zoom, w, h) + ",fps=30,setsar=1",
            "-c:v", "libx264", "-crf", "18", "-preset", "veryfast",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            str(dest)]
    subprocess.run(cmd, check=True)
    return Path(dest)


def concat(parts: list, out) -> Path:
    """Join shots. Re-encodes, because the sources were normalised above."""
    out = Path(out)
    # Lives in the work dir alongside the parts, so two builds writing to the
    # same output directory cannot overwrite each other's listing.
    listing = Path(parts[0]).parent / "concat.txt"
    # Absolute paths: the concat demuxer resolves relative entries against the
    # listing file's own directory, not the cwd, so a bare relative path here
    # would double up with the listing's own location.
    listing.write_text(
        "".join("file '%s'\n" % Path(p).resolve().as_posix().replace("'", "'\\''")
                for p in parts), encoding="utf-8")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
         "-i", str(listing), "-c:v", "libx264", "-crf", "18",
         "-c:a", "aac", "-b:a", "192k", str(out)],
        check=True)
    return out


def add_music(video, track, out, gain_db: float = -18.0, duck_ratio: float = 2.0) -> Path:
    """Lay a music bed under existing speech, ducked, then normalise loudness.

    sidechaincompress compresses its FIRST input using its SECOND as the key:
    the music is compressed, the speech is the trigger. Reversing them ducks
    the voice under the music, which is the classic way to get this backwards.

    duck_ratio is a compression ratio, NOT a decibel figure. Actual gain
    reduction is (excess above threshold) x (1 - 1/ratio), so it depends on how
    loud the speech is. Higher ducks harder; 2.0 is gentle, 8.0 is aggressive.
    An earlier version named this duck_db and derived the ratio from it, which
    promised a dB outcome the filter does not deliver.
    """
    ratio = max(1.0, duck_ratio)
    filt = (
        # size caps the loop buffer in samples; -shortest bounds the output anyway.
        f"[1:a]volume={gain_db}dB,aloop=loop=-1:size=2e9[bed];"
        f"[bed][0:a]sidechaincompress=threshold=0.03:ratio={ratio:.2f}"
        f":attack=20:release=300[ducked];"
        f"[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=0[mixed];"
        f"[mixed]loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(video), "-i", str(track),
         "-filter_complex", filt, "-map", "0:v", "-map", "[out]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)],
        check=True)
    return Path(out)


def build_video(plan, takes_dir, out, work=None) -> Path:
    """Shot plan -> master.mp4, with music mixed in if the plan names a track."""
    problems = validate(plan, takes_dir)
    if problems:
        raise SystemExit("Refusing to build:\n  " + "\n  ".join(problems))
    # validate() is pure and cannot know how long a clip actually is. A window
    # past the end renders short, so the plan total silently stops matching.
    for i, shot in enumerate(plan.shots, 1):
        have = probe_one(Path(takes_dir) / shot.clip)["duration"]
        if shot.end > have + 0.05:
            raise SystemExit(
                f"Shot {i}: {shot.clip} is {have:.2f}s but the plan asks for "
                f"{shot.start:.2f}-{shot.end:.2f}. Fix the shot plan.")
    work = Path(work or Path(out).parent / f"_work_{Path(out).stem}")
    work.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, shot in enumerate(plan.shots, 1):
        part = work / f"shot_{i:02d}.mp4"
        print(f"  shot {i}: {shot.clip} {shot.duration:.1f}s zoom={shot.zoom:g}")
        try:
            parts.append(cut_shot(shot, takes_dir, part))
        except subprocess.CalledProcessError as e:
            raise SystemExit(
                f"Shot {i} ({shot.clip} {shot.start:.2f}-{shot.end:.2f}) failed to cut; "
                f"ffmpeg exited {e.returncode}.")
    joined = concat(parts, work / "joined.mp4")
    if plan.music:
        track = Path(takes_dir).parent / "music" / plan.music
        if track.exists():
            return add_music(joined, track, out, plan.music_gain_db, plan.duck_ratio)
        print(f"  music '{plan.music}' not found in music/ — building without it")
    # Both paths must end at the same loudness, or the master's level would
    # depend on whether a music track happened to be found.
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(joined),
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", str(out)],
        check=True)
    return Path(out)


if __name__ == "__main__":
    import sys
    from .shotplan import parse_plan
    plan_path = sys.argv[1] if len(sys.argv) > 1 else "shotplan.md"
    takes = sys.argv[2] if len(sys.argv) > 2 else "takes"
    out = sys.argv[3] if len(sys.argv) > 3 else "master.mp4"
    plan = parse_plan(Path(plan_path).read_text(encoding="utf-8"))
    print(build_video(plan, takes, out))
