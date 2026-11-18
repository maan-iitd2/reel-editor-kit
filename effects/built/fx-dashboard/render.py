"""FX dashboard renderer (trimmed from the motion-design skill's render_template.py).
probe t1 t2 ...  -> out/sheet.png
full             -> 30 fps, SUB subframes on a 180 deg shutter blended with tmix -> out/silent.mp4
audio            -> synthesized soft SFX + pad on the film's cue times -> out/audio.wav (-14 LUFS)
mux              -> out/dyou_test.mp4 (BT.709 TV range)
check            -> out/contact.png + pop scan
"""
import asyncio, shutil, subprocess, sys
from pathlib import Path
import numpy as np
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE / "out"
FF = "ffmpeg"
URL = (HERE / "film.html").resolve().as_uri()
BAR = 2.0013
FPS, T, SUB, SHUTTER = 30, 8.0, 4, 0.5
CUTS = []  # dissolves only, no hard cuts
A = HERE / 'assets/audio'
SONG, SONG_START = A / 'm22.mp3', 0.385  # Mixkit 'Piano Reflections', bar lines at 0.385 + 2.0 k
W, H = 1080, 1920


async def open_page(p):
    b = await p.chromium.launch()
    pg = await b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(URL)
    await pg.wait_for_function("window.ready === true", timeout=60000)
    await pg.add_style_tag(content="*,*::before,*::after{transition:none!important}#hud{display:none}")
    await pg.evaluate("document.getAnimations().forEach(a => a.pause())")
    return b, pg, errs


async def shot(pg, t, path, fmt="png"):
    await pg.evaluate(f"window.seek({t})")
    await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    await (await pg.query_selector("#stage")).screenshot(path=str(path), type=fmt, **({"quality": 95} if fmt == "jpeg" else {}))


async def probe(times):
    d = OUT / "probe"; shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
    async with async_playwright() as p:
        b, pg, errs = await open_page(p)
        for i, t in enumerate(times): await shot(pg, t, d / f"p_{i:02d}.png")
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:5])
    rows = -(-len(times) // 4)
    subprocess.run([FF, "-v", "error", "-y", "-i", str(d / "p_%02d.png"), "-vf", f"scale=270:-1,tile=4x{rows}:padding=6:color=white",
                    "-frames:v", "1", str(OUT / "sheet.png")], check=True)
    print("sheet ->", OUT / "sheet.png")


async def full():
    sub = HERE / "sub"; shutil.rmtree(sub, ignore_errors=True); sub.mkdir()
    n, k = int(T * FPS), 0
    offs = [(j - (SUB - 1) / 2) * SHUTTER / (FPS * SUB) for j in range(SUB)]
    async with async_playwright() as p:
        b, pg, errs = await open_page(p)
        for i in range(n):
            for o in offs:
                tc, ts = i / FPS, min(T - 1e-3, max(0.0, i / FPS + o))
                for c in CUTS:
                    if (ts < c) != (tc < c): ts = c if tc >= c else c - 1e-4
                await shot(pg, ts, sub / f"s_{k:05d}.jpg", "jpeg"); k += 1
            if i % 30 == 0: print(f"frame {i}/{n}", flush=True)
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:5])
    subprocess.run([FF, "-v", "error", "-y", "-framerate", str(FPS * SUB), "-i", str(sub / "s_%05d.jpg"),
                    "-vf", f"tmix=frames={SUB},select='eq(mod(n\\,{SUB})\\,{SUB - 1})',setpts=N/{FPS}/TB", "-r", str(FPS),
                    "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", str(OUT / "silent.mp4")], check=True)
    shutil.rmtree(sub)
    print("video ->", OUT / "silent.mp4")


def load(path, sr):
    return np.frombuffer(subprocess.run([FF, "-v", "quiet", "-i", str(path), "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
                                        capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()


def audio():
    """Piano bed + close-up ASMR textures, each SFX placed by its measured peak on the frame it belongs to."""
    sr = 48000
    song = load(SONG, sr)[int(SONG_START * sr):][: int(T * sr)]
    n = len(song); t = np.arange(n) / sr
    song *= (np.minimum(t / .3, 1) * np.minimum((T - t) / 1.2, 1))[:, None] * 0.8
    mixd = song.copy()

    def place(x, at, gain):  # align the sample's loudest point to `at`
        pk = int(np.argmax(np.abs(x).sum(1))); i = int(at * sr) - pk
        if i < 0: x, i = x[-i:], 0
        x = x[: n - i] * gain
        mixd[i:i + len(x)] += x

    spray, mist, click, tick, bubble, whoosh = (load(A / f"s{k}.mp3", sr) for k in (3215, 1890, 1125, 1117, 2357, 1490))
    place(mist, BAR + 1.42, .28)              # model's spray in the footage
    place(spray, 2 * BAR + 0.35, .16)         # misting still, softer
    place(click, 3 * BAR + 0.02, .5)          # cap click on the product reveal
    m = int(.18 * sr); k = np.arange(m) / sr  # synthesized water-drop "plip": short sine with a fast upward glide
    plip = np.sin(2 * np.pi * (700 * k + 5200 * k * k)) * np.exp(-k / .035); plip = np.stack([plip, plip], 1)
    for i in range(3): place(plip, 4 * BAR + 0.42 + i * BAR / 3, .22)
    place(tick, 5 * BAR + BAR / 3 + 0.05, .35)  # stat lands
    place(whoosh, 7 * BAR - 0.05, .12)          # violet bloom into the end card
    place(bubble, 7 * BAR + 2 * BAR / 3 + 0.05, .25)  # wordmark
    raw = OUT / "raw.wav"
    subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", "-", str(raw)], input=mixd.astype(np.float32).tobytes(), check=True)
    subprocess.run([FF, "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.3:LRA=11", "-ar", str(sr), str(OUT / "audio.wav")], check=True)
    print("audio ->", OUT / "audio.wav")


def mux():
    subprocess.run([FF, "-v", "error", "-y", "-i", str(OUT / "silent.mp4"), "-i", str(OUT / "audio.wav"),
                    "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
                    "-color_range", "tv", "-colorspace", "bt709", "-c:v", "libx264", "-crf", "16", "-c:a", "aac", "-b:a", "256k",
                    "-shortest", "-movflags", "+faststart", str(OUT / "inbalance.mp4")], check=True)
    print("final ->", OUT / "inbalance.mp4")


def check():
    f = OUT / "inbalance.mp4"
    subprocess.run([FF, "-v", "error", "-y", "-i", str(f), "-vf", "fps=2,scale=216:-1,tile=8x2:padding=4:color=white", "-frames:v", "1", str(OUT / "contact.png")], check=True)
    raw = subprocess.run([FF, "-v", "quiet", "-i", str(f), "-vf", "scale=180:180,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 180, 180).astype(np.float32)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    hits = [(i + 1, round((i + 1) / FPS, 2)) for i in range(1, len(d) - 1) if d[i] > 3 * max(d[i - 1], d[i + 1], .3) and d[i] > 2]
    print("contact ->", OUT / "contact.png", "| pops:", hits or "none")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    cmd = sys.argv[1]
    if cmd == "probe": asyncio.run(probe([float(x) for x in sys.argv[2:]]))
    elif cmd == "full": asyncio.run(full())
    elif cmd == "audio": audio()
    elif cmd == "mux": mux()
    elif cmd == "check": check()
