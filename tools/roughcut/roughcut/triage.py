"""Triage: which parts of a take are worth keeping.

Pure functions over word lists. No ffmpeg, no GPU, no network — this is the
module with the real logic, so it is the one that must be trivially testable.

Thresholds are constants and CLI flags, not findings. Speech varies by room,
mic and person; tune these against real footage.
"""
from difflib import SequenceMatcher

MIN_GAP = 0.8        # a pause longer than this is dead air
PAD = 0.15           # keep this much either side so speech is not clipped
RETAKE_THRESHOLD = 0.75
# Below this many characters SequenceMatcher's ratio is unstable: "nice" and
# "rice" score exactly 0.75. A retake is a re-attempted sentence, not a rhyme.
MIN_RETAKE_CHARS = 12
# "like" and "so" are deliberately absent: too often legitimate speech.
FILLERS = {"um", "uh", "er", "erm", "hmm", "mm"}


def is_filler(word: str) -> bool:
    return word.strip().strip(".,!?;:").lower() in FILLERS


def strip_fillers(words: list) -> list:
    return [w for w in words if not is_filler(w["word"])]


def speech_span(words: list, pad: float = PAD) -> tuple:
    """Tight bounds around all speech, padded. (0.0, 0.0) if silent."""
    if not words:
        return (0.0, 0.0)
    return (max(0.0, words[0]["start"] - pad), words[-1]["end"] + pad)


def internal_gaps(words: list, min_gap: float = MIN_GAP) -> list:
    """Pauses between consecutive words longer than min_gap."""
    out = []
    for a, b in zip(words, words[1:]):
        if b["start"] - a["end"] > min_gap:
            out.append((a["end"], b["start"]))
    return out


def normalise(text: str) -> str:
    keep = [c.lower() for c in text if c.isalnum() or c.isspace()]
    return " ".join("".join(keep).split())


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalise(a), normalise(b)).ratio()


def retake_pairs(sentences: list, threshold: float = RETAKE_THRESHOLD) -> list:
    """(earlier, later) index pairs where earlier is a worse take of later.

    Only compares neighbours: a retake follows the flub immediately. Comparing
    all pairs would flag legitimate repetition later in the video.
    Fragments under MIN_RETAKE_CHARS are skipped. This module throws footage
    away, and on short strings a single differing character still clears 0.75.
    """
    out = []
    for i in range(len(sentences) - 1):
        a, b = normalise(sentences[i]), normalise(sentences[i + 1])
        if min(len(a), len(b)) < MIN_RETAKE_CHARS:
            continue
        if similarity(sentences[i], sentences[i + 1]) >= threshold:
            out.append((i, i + 1))
    return out


def suggest_window(words: list, max_len: float = 0.0) -> tuple:
    """The tightest usable window: trim outer silence, stop at the first long gap.

    ponytail: takes the first speech run, not the best one. Upgrade to scoring
    every run by duration if takes routinely have several good chunks.
    """
    speech = strip_fillers(words)
    if not speech:
        return (0.0, 0.0)
    start, end = speech_span(speech)
    for gap_start, _ in internal_gaps(speech):
        if gap_start > start:
            end = gap_start + PAD
            break
    if max_len and end - start > max_len:
        end = start + max_len
    return (start, end)


def _w(word, start, end):
    return {"word": word, "start": start, "end": end}


def _selfcheck() -> None:
    assert is_filler("Um,") and is_filler("uh")
    assert not is_filler("like") and not is_filler("so")

    words = [_w("hello", 1.0, 1.4), _w("um", 1.5, 1.7), _w("world", 1.8, 2.3)]
    assert len(strip_fillers(words)) == 2
    lo, hi = speech_span(words)
    assert abs(lo - 0.85) < 1e-9 and abs(hi - 2.45) < 1e-9
    assert speech_span([]) == (0.0, 0.0)

    # A 2.0s pause is a gap; a 0.1s one is not.
    gapped = [_w("a", 0.0, 0.5), _w("b", 2.5, 3.0), _w("c", 3.1, 3.5)]
    assert internal_gaps(gapped) == [(0.5, 2.5)]

    assert normalise("So, TODAY!") == "so today"
    assert similarity("so today I will", "So today I will!") > 0.95
    assert similarity("apples", "helicopters") < 0.5

    takes = [
        "So today I wanted to show, no wait",
        "So today I wanted to show you this",
        "Completely different sentence here",
    ]
    pairs = retake_pairs(takes)
    assert pairs == [(0, 1)], pairs

    # Short fragments must never be flagged: ratio() is unstable there and
    # these score exactly at the threshold.
    assert retake_pairs(["nice", "rice"]) == []
    assert retake_pairs(["ship", "chip", "shop"]) == []
    # The long-sentence case must still be caught after the guard.
    assert retake_pairs(takes) == [(0, 1)]

    # suggest_window trims the filler and stops at the long gap.
    w = [_w("one", 1.0, 1.4), _w("um", 1.5, 1.7), _w("two", 1.8, 2.2),
         _w("three", 5.0, 5.4)]
    lo, hi = suggest_window(w)
    assert abs(lo - 0.85) < 1e-9, lo
    assert abs(hi - 2.35) < 1e-9, hi
    assert suggest_window([]) == (0.0, 0.0)
    assert suggest_window(w, max_len=0.5) == (0.85, 1.35)
    print("triage selfcheck OK")


if __name__ == "__main__":
    _selfcheck()
