"""The shot plan: the one artifact a human approves.

Line-based on purpose. You edit this file during the approval step, and a
markdown table would mean re-aligning pipes to change one number.
"""
import re
from dataclasses import dataclass, field
from pathlib import Path

from .timefmt import fmt_time, parse_time

DEFAULT_MUSIC_GAIN_DB = -18.0
DEFAULT_DUCK_RATIO = 2.0

_SHOT_RE = re.compile(
    r"^\s*(\d+)\.\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$"
)
_KV_RE = re.compile(r"(\w+)=(\S+)")


@dataclass
class Shot:
    clip: str
    start: float
    end: float
    zoom: float = 1.0
    enter: str = "cut"        # "cut" or "xfade:<seconds>"
    note: str = ""

    @property
    def duration(self) -> float:
        return self.end - self.start


@dataclass
class ShotPlan:
    intent: str = ""
    target_s: float = 30.0
    music: str = ""
    music_gain_db: float = DEFAULT_MUSIC_GAIN_DB
    duck_ratio: float = DEFAULT_DUCK_RATIO
    shots: list = field(default_factory=list)
    why: str = ""
    rejected: str = ""
    bad_lines: list = field(default_factory=list)

    @property
    def total(self) -> float:
        return sum(s.duration for s in self.shots)


def parse_plan(text: str) -> ShotPlan:
    plan = ShotPlan()
    section = ""
    why, rejected = [], []
    for raw in text.splitlines():
        line = raw.rstrip()
        low = line.strip().lower()
        if low.startswith("## "):
            # First word only: headers carry annotations, e.g. "## Shots (total 18.1s)".
            head = low[3:].split()
            section = head[0] if head else ""
            continue
        if section == "shots":
            m = _SHOT_RE.match(line)
            if m:
                _, clip, tin, tout, rest = m.groups()
                kv = dict(_KV_RE.findall(rest))
                plan.shots.append(Shot(
                    clip=clip,
                    start=parse_time(tin),
                    end=parse_time(tout),
                    zoom=float(kv.get("zoom", 1.0)),
                    enter=kv.get("enter", "cut"),
                    note=_KV_RE.sub("", rest).strip(" #\t"),
                ))
            elif line.strip():
                plan.bad_lines.append(line)
            continue
        if section == "why":
            why.append(line)
            continue
        if section == "rejected":
            rejected.append(line)
            continue
        if ":" in line and not line.startswith("#"):
            key, _, val = line.partition(":")
            key, val = key.strip().lower(), val.strip()
            if key == "intent":
                plan.intent = val
            elif key == "target":
                plan.target_s = parse_time(val.rstrip("s"))
            elif key == "music":
                plan.music = val
            elif key == "music_gain_db":
                plan.music_gain_db = float(val)
            elif key == "duck_ratio":
                plan.duck_ratio = float(val)
    plan.why = "\n".join(why).strip()
    plan.rejected = "\n".join(rejected).strip()
    return plan


def render_plan(plan: ShotPlan) -> str:
    lines = [
        "# Shot plan",
        f"intent: {plan.intent}",
        f"target: {plan.target_s:g}s",
        f"music: {plan.music}",
        f"music_gain_db: {plan.music_gain_db:g}",
        f"duck_ratio: {plan.duck_ratio:g}",
        "",
        f"## Shots   (total {plan.total:.1f}s)",
    ]
    for i, s in enumerate(plan.shots, 1):
        note = f"  # {s.note}" if s.note else ""
        lines.append(
            f"{i}. {s.clip} {fmt_time(s.start)} {fmt_time(s.end)} "
            f"zoom={s.zoom:g} enter={s.enter}{note}"
        )
    lines += ["", "## Why", plan.why, "", "## Rejected", plan.rejected, ""]
    return "\n".join(lines)


def validate(plan: ShotPlan, clips_dir) -> list:
    """Return a list of problems. Empty list means the plan is buildable."""
    problems = []
    if not plan.shots:
        problems.append("plan has no shots")
    for line in plan.bad_lines:
        problems.append(f"unparsable shot line: {line!r}")
    for i, s in enumerate(plan.shots, 1):
        if s.duration <= 0:
            problems.append(f"shot {i}: out ({s.end}) is not after in ({s.start})")
        if not (Path(clips_dir) / s.clip).exists():
            problems.append(f"shot {i}: clip not found: {s.clip}")
        if s.zoom < 1.0:
            problems.append(f"shot {i}: zoom {s.zoom} would letterbox; must be >= 1.0")
        if s.enter != "cut" and not s.enter.startswith("xfade:"):
            problems.append(f"shot {i}: unknown transition {s.enter!r}")
    if plan.shots and plan.total < 5:
        problems.append(f"total {plan.total:.1f}s is under 5s; almost certainly a bad plan")
    if plan.total > 90:
        problems.append(f"total {plan.total:.1f}s is over 90s; almost certainly a bad plan")
    return problems


def _selfcheck() -> None:
    import tempfile

    src = """# Shot plan
intent: wiring up the bridge
target: 30s
music: neon-drive.mp3
music_gain_db: -18
duck_ratio: 2

## Shots
1. take_04.mp4 00:03.2 00:11.8 zoom=1.0 enter=cut  # the hook
2. take_07.mp4 00:14.0 00:23.5 zoom=1.06 enter=xfade:0.3

## Why
04 has the cleanest audio.

## Rejected
01, 03 out of focus.
"""
    p = parse_plan(src)
    assert p.intent == "wiring up the bridge", p.intent
    assert p.target_s == 30.0
    assert p.music == "neon-drive.mp3"
    assert p.duck_ratio == 2.0
    assert len(p.shots) == 2
    assert p.shots[0].clip == "take_04.mp4"
    assert abs(p.shots[0].start - 3.2) < 1e-9
    assert p.shots[0].note == "the hook", repr(p.shots[0].note)
    assert p.shots[1].zoom == 1.06
    assert p.shots[1].enter == "xfade:0.3"
    assert abs(p.total - (8.6 + 9.5)) < 0.05, p.total
    assert "cleanest audio" in p.why
    assert "out of focus" in p.rejected

    # Round-trip: rendering then reparsing preserves every field we act on.
    q = parse_plan(render_plan(p))
    assert len(q.shots) == 2
    assert q.shots[1].enter == "xfade:0.3"
    assert q.music == p.music
    assert abs(q.total - p.total) < 0.05
    # Verify all shot fields survive round-trip.
    assert q.shots[0].clip == p.shots[0].clip
    assert q.shots[1].clip == p.shots[1].clip
    assert abs(q.shots[0].start - p.shots[0].start) < 0.05
    assert abs(q.shots[0].end - p.shots[0].end) < 0.05
    assert abs(q.shots[1].start - p.shots[1].start) < 0.05
    assert abs(q.shots[1].end - p.shots[1].end) < 0.05
    assert q.shots[0].zoom == p.shots[0].zoom
    assert q.shots[1].zoom == p.shots[1].zoom
    assert q.shots[0].enter == p.shots[0].enter
    assert q.shots[0].note == p.shots[0].note
    assert q.shots[1].note == p.shots[1].note
    # Verify plan-level fields survive round-trip.
    assert q.target_s == p.target_s
    assert q.music_gain_db == p.music_gain_db
    assert q.duck_ratio == p.duck_ratio

    # Defaults apply when the optional keys are absent.
    r = parse_plan("## Shots\n1. a.mp4 0 5\n")
    assert r.shots[0].zoom == 1.0 and r.shots[0].enter == "cut"

    # A mistyped shot line is collected, not silently dropped, and validate()
    # reports it as a problem.
    bad = parse_plan("## Shots\n1. a.mp4 0 5\nthis is not a shot line\n")
    assert bad.bad_lines == ["this is not a shot line"], bad.bad_lines
    with tempfile.TemporaryDirectory() as d:
        (Path(d) / "a.mp4").write_bytes(b"")
        probs = validate(bad, d)
        assert any("unparsable shot line" in x for x in probs), probs

    # validate() catches a missing clip and a backwards range.
    with tempfile.TemporaryDirectory() as d:
        (Path(d) / "a.mp4").write_bytes(b"")
        bad = ShotPlan(shots=[Shot("a.mp4", 5, 1), Shot("ghost.mp4", 0, 10)])
        probs = validate(bad, d)
        assert any("not after" in x for x in probs), probs
        assert any("ghost.mp4" in x for x in probs), probs
        ok = ShotPlan(shots=[Shot("a.mp4", 0, 10)])
        assert validate(ok, d) == []
    print("shotplan selfcheck OK")


if __name__ == "__main__":
    _selfcheck()
