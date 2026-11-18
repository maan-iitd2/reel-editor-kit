"""Shot detection: where the picture cuts.

ffmpeg's scene filter scores each frame against the previous one and emits the
ones above a threshold. No new dependency, no model, and it runs at decode
speed — a 10 minute take takes seconds.

Threshold is the knob. 0.3 is a normal cut; lower catches soft dissolves and
also camera shake, higher only catches hard cuts between very different shots.
Tune it against your own footage, not against this default.
"""
import re
import subprocess
from pathlib import Path

THRESHOLD = 0.3
MIN_SHOT = 0.4          # ignore cuts closer than this; below it you get flicker
_PTS_RE = re.compile(r"pts_time:([0-9.]+)")


def detect_cuts(path, threshold: float = THRESHOLD, min_shot: float = MIN_SHOT) -> list:
    """-> [seconds] where the picture cuts. Excludes 0.0; the first shot is implied."""
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", str(path),
         "-vf", f"select='gt(scene,{threshold})',metadata=print",
         "-an", "-f", "null", "-"],
        capture_output=True, text=True)
    if out.returncode != 0:
        # Without this an unreadable file reports "0 cuts" and looks like a
        # single-shot clip rather than an error.
        raise SystemExit(f"ffmpeg could not read {path}: "
                         f"{out.stderr.strip().splitlines()[-1] if out.stderr.strip() else 'unknown'}")
    times = [float(t) for t in _PTS_RE.findall(out.stderr)]
    return _thin(times, min_shot)


def _thin(times: list, min_shot: float = MIN_SHOT) -> list:
    """Drop cuts that land within min_shot of the previous kept one.

    The epsilon is load-bearing: 1.4 - 1.0 is 0.3999999999999999 in float, so a
    cut exactly min_shot away would otherwise be discarded by rounding error.
    """
    kept = []
    for t in sorted(times):
        if not kept or t - kept[-1] >= min_shot - 1e-6:
            kept.append(round(t, 3))
    return kept


def to_shots(cuts: list, duration: float) -> list:
    """Cut points -> [(start, end)] covering the whole clip."""
    bounds = [0.0] + [c for c in cuts if 0.0 < c < duration] + [float(duration)]
    return [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)
            if bounds[i + 1] > bounds[i]]


def _selfcheck() -> None:
    # _thin: cuts closer than min_shot collapse to the first of the run.
    assert _thin([1.0, 1.1, 1.2, 5.0], 0.4) == [1.0, 5.0]
    assert _thin([], 0.4) == []
    assert _thin([2.0, 1.0], 0.4) == [1.0, 2.0]          # unsorted input is sorted
    assert _thin([1.0, 1.4], 0.4) == [1.0, 1.4]          # exactly min_shot is kept

    # to_shots always spans the clip and never emits a zero-length shot.
    assert to_shots([], 10.0) == [(0.0, 10.0)]
    assert to_shots([4.0], 10.0) == [(0.0, 4.0), (4.0, 10.0)]
    assert to_shots([4.0, 7.0], 10.0) == [(0.0, 4.0), (4.0, 7.0), (7.0, 10.0)]
    # A cut at or past the end is ignored rather than making an empty shot.
    assert to_shots([10.0, 99.0], 10.0) == [(0.0, 10.0)]
    assert all(e > s for s, e in to_shots([1.0, 2.0, 3.0], 5.0))

    # The regex must read ffmpeg's real metadata line shape.
    line = "[Parsed_metadata_1 @ 0000] frame:0 pts:12288 pts_time:2.56"
    assert _PTS_RE.findall(line) == ["2.56"], _PTS_RE.findall(line)
    print("scenes selfcheck OK")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] != "--selfcheck":
        cuts = detect_cuts(sys.argv[1])
        print(f"{len(cuts)} cuts: {cuts}")
    else:
        _selfcheck()
