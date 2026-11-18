"""The music library: a folder you drop tracks into, plus an index you edit.

Matching is a filter, not a model. Mood is the one field a machine cannot infer
usefully, so you write it once per track and everything else is measured.
"""
import re
from dataclasses import dataclass
from pathlib import Path

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
HEADER = ("| file | bpm | duration | energy | mood | license |\n"
          "|------|-----|----------|--------|------|---------|\n")


@dataclass
class Track:
    file: str
    bpm: float = 0.0
    duration: float = 0.0
    energy: float = 0.0
    mood: str = ""
    license: str = ""

    def row(self) -> str:
        # A pipe in a hand-typed field would add a cell and shift every later
        # one on the next read, silently losing the license. Substitute rather
        # than escape: this file is read back by a plain split, not a parser.
        return (f"| {self.file} | {self.bpm:g} | {self.duration:.1f} | "
                f"{self.energy:.3f} | {self.mood.replace('|', '/')} | "
                f"{self.license.replace('|', '/')} |\n")


def read_index(path) -> list:
    path = Path(path)
    if not path.exists():
        return []
    tracks = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 6 or cells[0] in ("file", "") or set(cells[0]) <= set("-: "):
            continue
        def num(x):
            try:
                return float(x)
            except ValueError:
                return 0.0
        tracks.append(Track(cells[0], num(cells[1]), num(cells[2]),
                            num(cells[3]), cells[4], cells[5]))
    return tracks


def write_index(path, tracks: list) -> None:
    Path(path).write_text(
        "# Music index. Fill in `mood` and `license` by hand; the rest is measured.\n\n"
        + HEADER + "".join(t.row() for t in tracks), encoding="utf-8")


def analyse(path) -> tuple:
    """(bpm, duration, energy). Measured, never guessed."""
    import librosa
    import numpy as np
    y, sr = librosa.load(str(path), mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])   # librosa 0.11 returns an array
    return (round(bpm, 1), round(float(librosa.get_duration(y=y, sr=sr)), 1),
            round(float(np.sqrt(np.mean(y ** 2))), 3))


def scan(music_dir, index_path) -> list:
    """Add rows for new files. Never overwrites a mood or license you wrote."""
    music_dir = Path(music_dir)
    tracks = read_index(index_path)
    known = {t.file for t in tracks}
    if music_dir.exists():
        for f in sorted(music_dir.iterdir()):
            if f.suffix.lower() in AUDIO_EXT and f.name not in known:
                try:
                    bpm, dur, energy = analyse(f)
                except Exception as e:
                    # One unreadable file must not discard the rest of the scan.
                    print(f"  SKIPPED {f.name}: {e}")
                    continue
                tracks.append(Track(f.name, bpm, dur, energy))
                print(f"  added {f.name}: {bpm:g} bpm, {dur:.0f}s — set its mood in the index")
    write_index(index_path, tracks)
    return tracks


def match(tracks: list, intent: str, target_s: float = 30.0):
    """Best track for this intent, or None. Untagged tracks rank last."""
    usable = [t for t in tracks if t.duration >= target_s]
    if not usable:
        usable = list(tracks)
    if not usable:
        return None
    wanted = set(re.findall(r"[a-z]+", intent.lower()))

    def score(t: Track) -> tuple:
        mood_words = set(re.findall(r"[a-z]+", t.mood.lower()))
        overlap = len(wanted & mood_words)
        return (overlap, 1 if t.mood else 0, t.energy)

    return max(usable, key=score)


def _selfcheck() -> None:
    import tempfile

    with tempfile.TemporaryDirectory() as d:
        idx = Path(d) / "music.md"
        tracks = [Track("calm.mp3", 80, 200, 0.05, "calm slow ambient", "pixabay"),
                  Track("hype.mp3", 128, 180, 0.30, "upbeat energetic hype", "uppbeat"),
                  Track("untagged.mp3", 100, 240, 0.20)]
        write_index(idx, tracks)
        back = read_index(idx)
        assert len(back) == 3, back
        assert back[0].file == "calm.mp3" and back[0].bpm == 80
        assert back[1].mood == "upbeat energetic hype"
        assert back[2].mood == "" and back[2].license == ""

        assert match(back, "an upbeat energetic build montage", 30).file == "hype.mp3"
        assert match(back, "a calm slow explainer", 30).file == "calm.mp3"
        # Nothing matches the words, but a tagged track still beats an untagged one.
        assert match(back, "zzz nothing matches", 30).mood != ""
        # Too long for any track: fall back rather than returning None.
        assert match(back, "upbeat", 9999) is not None
        assert match([], "anything", 30) is None

        # A pipe typed into a hand-edited field must not shift later cells and
        # eat the license on the next read.
        piped = [Track("odd.mp3", 100, 200, 0.1, "chill | lofi", "pixabay")]
        write_index(idx, piped)
        got = read_index(idx)
        assert len(got) == 1, got
        assert got[0].license == "pixabay", got[0]
        assert "|" not in got[0].mood, got[0].mood

        # GitHub-style alignment separators must not become tracks.
        idx.write_text(HEADER.replace("|------|", "|:-----|").replace("|-----|", "|:---:|")
                       + "| a.mp3 | 90 | 100.0 | 0.100 | calm | free |\n", encoding="utf-8")
        rows = read_index(idx)
        assert len(rows) == 1 and rows[0].file == "a.mp3", rows
    print("music selfcheck OK")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == "--scan":
        scan(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "music.md")
    else:
        _selfcheck()
