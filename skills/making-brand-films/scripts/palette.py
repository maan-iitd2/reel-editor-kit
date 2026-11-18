"""Sample a brand palette from screenshots or images (stdlib + ffmpeg).
usage:
  python palette.py top <image> [x y w h]          dominant colour bins in a region (default: whole image)
  python palette.py ink <image> x y w h            ink colour of text in a box (median of the darkest 8 % of pixels)
Point samples miss thin type strokes; always use `ink` on a box around the text.
"""
import collections, subprocess, sys


def raw(path, vf):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return [out[i:i + 3] for i in range(0, len(out), 3)]


def hexc(c): return "#%02x%02x%02x" % tuple(c)


cmd, img, *box = sys.argv[1:]
crop = f"crop={box[2]}:{box[3]}:{box[0]}:{box[1]}," if box else ""
if cmd == "top":
    px = raw(img, crop + "scale=120:-1")
    q = collections.Counter(tuple(v // 16 * 16 + 8 for v in p) for p in px)
    print("  ".join(f"{hexc(c)}:{n}" for c, n in q.most_common(10)))
elif cmd == "ink":
    px = sorted(raw(img, crop.rstrip(",")), key=sum)
    dark = px[: max(1, len(px) // 12)]
    print(hexc([sorted(p[k] for p in dark)[len(dark) // 2] for k in range(3)]))
