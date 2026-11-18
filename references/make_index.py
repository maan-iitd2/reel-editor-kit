"""Rebuild the 'All downloaded reels' table in index.md from yt-dlp's .info.json files.

Run after download.sh:  python make_index.py
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
MARK = "## All downloaded reels"


def probe_seconds(path: Path) -> float:
    # logged-out Instagram metadata has no duration (or view count), so read it from the file
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout
    return float(out.strip() or 0)


def row(info: dict, mp4: str, seconds: float) -> str:
    cap = " ".join((info.get("description") or "").split())[:110].replace("|", "/")
    likes = info.get("like_count") or ""
    d = info.get("upload_date") or ""
    date = f"{d[:4]}-{d[4:6]}-{d[6:]}" if len(d) == 8 else d
    return f"| {date} | [{info['id']}](https://www.instagram.com/reel/{info['id']}/) | {likes} | {round(seconds)}s | {cap} | `{mp4}` |"


def table(folder: Path) -> str:
    rows = []
    for j in sorted(folder.glob("*.info.json"), reverse=True):
        info = json.loads(j.read_text(encoding="utf-8"))
        mp4 = j.name.replace(".info.json", ".mp4")
        if (folder / mp4).exists():
            rows.append(row(info, f"videos/{mp4}", probe_seconds(folder / mp4)))
    head = "| Date | Reel | Likes | Length | Caption (start) | File |\n|---|---|---|---|---|---|"
    return f"{MARK} ({len(rows)})\n\nNewest first. Made by `make_index.py` from yt-dlp metadata.\n\n{head}\n" + "\n".join(rows) + "\n"


def main() -> None:
    idx = HERE / "index.md"
    text = idx.read_text(encoding="utf-8")
    keep = text.split(MARK)[0].rstrip() + "\n\n"
    idx.write_text(keep + table(HERE / "videos"), encoding="utf-8")
    print(idx)


if __name__ == "__main__":
    row_ = row({"id": "X1", "upload_date": "20261010", "description": "a | b"}, "videos/x.mp4", 21.6)
    assert "2026-10-10" in row_ and "a / b" in row_ and "22s" in row_, row_
    main()
