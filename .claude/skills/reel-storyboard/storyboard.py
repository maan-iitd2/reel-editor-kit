"""justyn.ai-style storyboard: a grid of shot cards + one stacked "beat card" per shot. Run with C:\\Python314\\python.exe.

  stills <shots.json> --video <file.mp4>       grab each missing still at the middle of its shot -> <dir>/stills/<id>.jpg
  stills <shots.json> --film <film.html> [--w 1080 --h 1920]   same, but from a seek(t) film (served over http)
  build  <shots.json> [--out <dir>]            -> <dir>/storyboard.html, grid.png, beats/<id>.png  (default dir: next to shots.json)

shots.json: {"title": "...", "aspect": "9:16" | "16:9", "shots": [{"id": "p01", "t0": 0.0, "t1": 3.1, "label": "Talking head, wide",
  "quote": "I didn't edit a single second of this video.", "beat": "On ==scene== a hard wipe...", "sound": "whoosh",
  "score": "the scene changes", "still": "stills/p01.jpg"}]}
"==text==" in "beat" or "sound" gets the gold marker underline. Paths are relative to shots.json.
"""
import asyncio, functools, html, http.server, json, re, subprocess, sys, threading
from pathlib import Path

SKILL = Path(__file__).parent


def esc(s):
    return re.sub(r"==(.+?)==", r'<span class="hl">\1</span>', html.escape(s or ""))


def fmt(t):
    return f"{int(t // 60)}:{t % 60:04.1f}"


CSS = """
:root{--paper:#F2EEE3;--rule:#E1DAC8;--green:#1F3A2B;--ink:#2A2925;--gold:#C9A24E;--cream:#EAE5D6}
*{box-sizing:border-box} body{margin:0;background:#18291F;font-family:'EB Garamond'}
#grid{width:1080px;padding:56px 40px 48px;background:#18291F}
#grid h1{margin:0 0 30px 6px;font:500 15px/1 'JetBrains Mono';letter-spacing:.24em;color:#B9C3AE}
#grid h1 b{color:var(--gold);font-weight:700}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 18px}
.card{background:var(--paper);border-radius:4px;padding:7px 7px 10px;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.card img{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:2px}
.bar{display:flex;justify-content:space-between;align-items:center;height:20px;padding:0 7px;background:var(--green);
     font:500 11px/1 'JetBrains Mono';color:var(--cream);margin-top:5px;border-radius:1px}
.card q{quotes:'“' '”';display:block;margin:8px 2px 0;font:italic 400 14px/1.3 'EB Garamond';color:var(--ink)}
.beatwrap{position:relative;width:600px;padding:22px 26px 30px 18px;background:transparent}
.beat{position:relative;z-index:3;background:var(--paper);border-radius:6px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.28)}
.stack1,.stack2{position:absolute;inset:22px 26px 30px 18px;background:#E9E4D6;border-radius:6px;box-shadow:0 8px 20px rgba(0,0,0,.18)}
.stack1{transform:translate(7px,7px) rotate(1.1deg);z-index:2} .stack2{transform:translate(12px,13px) rotate(-.7deg);z-index:1;background:#E2DCCB}
.bh{display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 20px;background:var(--green);
    font:500 15px/1 'JetBrains Mono';color:var(--cream)} .bh b{color:var(--gold);font-weight:700;font-size:18px}
.bb{padding:18px 24px 26px;background:var(--paper) repeating-linear-gradient(to bottom,transparent 0 43px,var(--rule) 43px 44px);background-position:0 26px}
.bb h2{margin:0 0 10px;font:italic 400 36px/1.12 'Instrument Serif';color:#22402F}
.bb p{margin:0;font:400 23px/44px 'EB Garamond';color:var(--ink)}
.hl{box-shadow:inset 0 -3px 0 var(--gold)}
.row{display:flex;gap:18px;align-items:baseline;font:400 23px/44px 'EB Garamond'}
.row i{font:500 12px/44px 'JetBrains Mono';font-style:normal;letter-spacing:.14em;width:64px;color:#5A574F}
.btn{display:inline-block;margin-top:22px;padding:8px 18px;border:1.5px solid var(--ink);border-radius:22px;font:500 15px/1.2 Inter;color:var(--ink);background:var(--paper)}
"""


def page(sb, base):
    shots = sb["shots"]
    wide = sb.get("aspect", "9:16") == "16:9"   # 16:9 videos: 3 wider cards per row
    total = max(s["t1"] for s in shots) if shots else 0
    src = lambda s: (base / s["still"]).resolve().as_uri() if s.get("still") else ""
    cards = "".join(f'<div class="card"><img src="{src(s)}"><div class="bar"><span>{s["id"]}</span><span>{fmt(s["t0"])}–{fmt(s["t1"])}</span></div>'
                    f'<q>{html.escape(s.get("quote", ""))}</q></div>' for s in shots)
    beats = "".join(f'<div class="beatwrap" id="b_{s["id"]}"><div class="stack2"></div><div class="stack1"></div><div class="beat">'
                    f'<div class="bh"><b>{s["id"]}</b><span>{s["t1"] - s["t0"]:.1f}s · {html.escape(s.get("label", ""))}</span></div>'
                    f'<div class="bb"><h2>“{html.escape(s.get("quote", ""))}”</h2><p>{esc(s.get("beat", ""))}</p>'
                    + (f'<div class="row" style="margin-top:22px"><i>SOUND</i><span class="hl">{html.escape(s["sound"].replace("==", ""))}</span></div>' if s.get("sound") else "")
                    + (f'<div class="row"><i>SCORE</i><span>{esc(s["score"])}</span></div>' if s.get("score") else "")
                    + '<div class="btn">Comment on this beat</div></div></div></div>' for s in shots)
    return (f'<!doctype html><html><head><meta charset="utf-8"><title>Storyboard · {html.escape(sb.get("title", ""))}</title>'
            f'<link rel="stylesheet" href="{(SKILL / "fonts.css").resolve().as_uri()}"><style>{CSS}</style></head><body>'
            f'<style>{".cards{grid-template-columns:repeat(3,1fr)}#grid{width:1500px}.card img{aspect-ratio:16/9}" if wide else ""}</style><div id="grid"><h1><b>STORYBOARD</b> · {html.escape(sb.get("title", "").upper())} · {len(shots)} SHOTS · {fmt(total)}</h1>'
            f'<div class="cards">{cards}</div></div><div id="beats" style="display:flex;flex-wrap:wrap;width:1300px;background:#18291F">{beats}</div>'
            f'<script>document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=i.onerror=r)))).then(()=>window.ready=true)</script>'
            f'</body></html>')


async def build(path, out):
    from playwright.async_api import async_playwright
    sb = json.loads(path.read_text(encoding="utf-8")); out.mkdir(parents=True, exist_ok=True); (out / "beats").mkdir(exist_ok=True)
    hp = out / "storyboard.html"; hp.write_text(page(sb, path.parent), encoding="utf-8")
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1500, "height": 1000}, device_scale_factor=2)
        await pg.goto(hp.resolve().as_uri()); await pg.wait_for_function("window.ready === true", timeout=60000)
        await (await pg.query_selector("#grid")).screenshot(path=str(out / "grid.png"))
        for s in sb["shots"]:
            await (await pg.query_selector(f"#b_{s['id']}")).screenshot(path=str(out / "beats" / f"{s['id']}.png"), omit_background=True)
        await b.close()
    print("storyboard ->", hp, "| grid.png + beats/ in", out)


async def stills_from_film(path, film, w, h):
    from playwright.async_api import async_playwright
    sb = json.loads(path.read_text(encoding="utf-8")); d = path.parent / "stills"; d.mkdir(exist_ok=True)
    root = film.parent
    hd = type("Q", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(hd, directory=str(root)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"])
        pg = await b.new_page(viewport={"width": w, "height": h})
        await pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/{film.name}"); await pg.wait_for_function("window.ready === true", timeout=120000)
        for s in sb["shots"]:
            if s.get("still") and (path.parent / s["still"]).exists(): continue
            await pg.evaluate(f"window.seek({(s['t0'] + s['t1']) / 2})")
            await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            await pg.screenshot(path=str(d / f"{s['id']}.jpg"), type="jpeg", quality=90); s["still"] = f"stills/{s['id']}.jpg"
        await b.close()
    path.write_text(json.dumps(sb, ensure_ascii=False, indent=1), encoding="utf-8")


def stills_from_video(path, video):
    sb = json.loads(path.read_text(encoding="utf-8")); d = path.parent / "stills"; d.mkdir(exist_ok=True)
    for s in sb["shots"]:
        if s.get("still") and (path.parent / s["still"]).exists(): continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(s['t0'] + s['t1']) / 2:.3f}", "-i", str(video), "-frames:v", "1",
                        "-q:v", "3", str(d / f"{s['id']}.jpg")], check=True)
        s["still"] = f"stills/{s['id']}.jpg"
    path.write_text(json.dumps(sb, ensure_ascii=False, indent=1), encoding="utf-8")
    print("stills ->", d)


if __name__ == "__main__":
    assert fmt(3.14) == "0:03.1" and fmt(75.0) == "1:15.0", fmt(3.14)
    assert esc("a ==b== <c>") == 'a <span class="hl">b</span> &lt;c&gt;'
    if len(sys.argv) > 2:
        cmd, sj = sys.argv[1], Path(sys.argv[2]).resolve(); a = sys.argv[3:]
        opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
        if cmd == "stills" and opt("--video"): stills_from_video(sj, Path(opt("--video")))
        elif cmd == "stills": asyncio.run(stills_from_film(sj, Path(opt("--film")).resolve(), int(opt("--w", 1080)), int(opt("--h", 1920))))
        elif cmd == "build": asyncio.run(build(sj, Path(opt("--out", sj.parent / "storyboard"))))
