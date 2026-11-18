"""Mixkit (free commercial licence) search + download for music, SFX and stock video.
usage:
  python mixkit.py music <genre-or-tag/x> ...     e.g. music tag/piano ambient   -> id | title
  python mixkit.py sfx <tag> ...                   e.g. sfx spray click bubble    -> id | title
  python mixkit.py video <keyword> ...             e.g. video skincare facial-mist -> slug-with-id
  python mixkit.py get music|sfx|video <id> ... --to DIR   download (video = 720p; vertical clips may only exist at other sizes)
"""
import re, sys, urllib.request
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()


def page(path): return get("https://mixkit.co/" + path).decode("utf8", "ignore")


def music(q):
    s = page(f"free-stock-music/{q}/")
    ids = list(dict.fromkeys(re.findall(r"music/(\d+)/\1\.mp3", s)))
    titles = re.findall(r"item-grid-card__title[^>]*>\s*([^<]+?)\s*<", s)
    for i, t in zip(ids, titles): print(f"  {i:>5} | {t}")


def sfx(q):
    s = page(f"free-sound-effects/{q}/")
    marks = [(m.start(), m.group(1)) for m in re.finditer(r'data-audio-player-item-id-value="(\d+)"', s)]
    titles = [(m.start(), m.group(1).strip()) for m in re.finditer(r'item-grid-card__title">\s*(?:<[^>]+>\s*)*([^<]+?)\s*<', s)]
    for k, (p, sid) in enumerate(marks):
        nxt = marks[k + 1][0] if k + 1 < len(marks) else len(s)
        t = [x for pos, x in titles if p < pos < nxt]
        print(f"  {sid:>5} | {t[0] if t else '?'}")


def video(q):
    s = page(f"free-stock-video/{q}/")
    for slug in sorted(set(re.findall(r'href="/free-stock-video/([a-z0-9-]+-\d+)/"', s))): print("  " + slug)


def download(kind, ids, to):
    to.mkdir(parents=True, exist_ok=True)
    url = {"music": "https://assets.mixkit.co/music/{i}/{i}.mp3",
           "sfx": "https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3",
           "video": "https://assets.mixkit.co/videos/{i}/{i}-720.mp4"}[kind]
    for i in ids:
        dst = to / f"{kind[0]}{i}{'.mp4' if kind == 'video' else '.mp3'}"
        try: dst.write_bytes(get(url.format(i=i))); print("  ok", dst)
        except Exception as e: print("  FAIL", i, e)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "get":
        to = Path(a[a.index("--to") + 1]) if "--to" in a else Path(".")
        download(a[1], [x for x in a[2:] if x.isdigit()], to)
    else:
        for q in a[1:]:
            print("==", a[0], q); {"music": music, "sfx": sfx, "video": video}[a[0]](q)
