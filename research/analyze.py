"""Transcribe and measure every reference reel.

Run with the shared venv (faster-whisper on GPU, via roughcut):
  $env:PYTHONPATH="C:\\VOLUME_D\\Ideas\\roughcut"
  C:\\VOLUME_D\\Ideas\\davinci-resolve-mcp\\venv\\Scripts\\python.exe research\\analyze.py

Writes research/analysis/<id>.json (words + visual changes) and research/analysis/summary.csv.
Re-runnable: reels that already have a JSON are skipped.
"""
import csv
import json
import subprocess
import sys
from pathlib import Path

from roughcut.scenes import detect_cuts
from roughcut.stt import transcribe

ROOT = Path(__file__).resolve().parent.parent
VIDEOS = ROOT / "references" / "videos"
OUT = ROOT / "research" / "analysis"


def duration(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def stats(words: list, changes: list, dur: float) -> dict:
    text = " ".join(w["word"] for w in words)
    speech = sum(w["end"] - w["start"] for w in words)
    hook = " ".join(w["word"] for w in words if w["start"] < 3.0)
    shots = [b - a for a, b in zip([0.0] + changes, changes + [dur])] if dur else []
    return {
        "duration_s": round(dur, 1),
        "words": len(words),
        "wpm": round(len(words) / (dur / 60), 1) if dur else 0,
        "speech_ratio": round(speech / dur, 2) if dur else 0,
        "first_word_s": round(words[0]["start"], 2) if words else None,
        "visual_changes": len(changes),
        "changes_per_10s": round(len(changes) / dur * 10, 2) if dur else 0,
        "avg_shot_s": round(sum(shots) / len(shots), 2) if shots else 0,
        "hook_3s": hook,
        "text": text,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(VIDEOS.glob("*.mp4"))
    for i, mp4 in enumerate(files, 1):
        dst = OUT / (mp4.stem + ".json")
        if dst.exists():
            continue
        dur = duration(mp4)
        words = transcribe(mp4, language="en")
        changes = detect_cuts(mp4, threshold=0.3, min_shot=0.25)
        dst.write_text(json.dumps({"file": mp4.name, **stats(words, changes, dur),
                                   "changes": changes, "word_times": words},
                                  ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[{i}/{len(files)}] {mp4.name}: {len(words)} words, {len(changes)} changes", flush=True)
    rows = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(OUT.glob("*.json"))]
    cols = ["file", "duration_s", "words", "wpm", "speech_ratio", "first_word_s",
            "visual_changes", "changes_per_10s", "avg_shot_s", "hook_3s"]
    with open(OUT / "summary.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"summary -> {OUT / 'summary.csv'} ({len(rows)} reels)")


if __name__ == "__main__":
    s = stats([{"word": "Hi", "start": 0.2, "end": 0.5}, {"word": "there", "start": 3.5, "end": 3.9}],
              [2.0, 4.0], 6.0)
    assert s["hook_3s"] == "Hi" and s["changes_per_10s"] == 3.33 and s["avg_shot_s"] == 2.0, s
    if "--check" not in sys.argv:
        main()
