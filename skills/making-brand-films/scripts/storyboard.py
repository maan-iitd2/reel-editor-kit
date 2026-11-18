"""Storyboard step for a brand film: shot table + one rendered still per beat on a contact sheet.
usage:
  python storyboard.py skeleton <film_dir> [--md STORYBOARD.md]      film.html SHOTS array -> shot table skeleton (existing film, retroactive)
  python storyboard.py sheet <film_dir> [--md STORYBOARD.md] [--out dir] [--audio file]   still at each beat's midpoint -> stills/ + storyboard.html
  python storyboard.py selfcheck
<film_dir> holds film.html (window.seek(t), window.ready, #stage 1080x1920, as in templates/film.html).
The sheet is a phone-width column: beat number + time, on-screen text, `sees`, `sound` only (word limits: templates/STORYBOARD.template.md).
It embeds the soundtrack (mp3, base64) with a play-from-here button per beat: --audio file, else <film_dir>/out/audio.wav, made by `python render.py audio` when missing.
Defaults: md = <film_dir>/storyboard/STORYBOARD.md, out = <film_dir>/storyboard. Table format: templates/STORYBOARD.template.md.
"""
import asyncio, base64, html, re, subprocess, sys, tempfile, wave
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
TEMPLATE = HERE.parent / "templates" / "STORYBOARD.template.md"
W, H = 1080, 1920
SAFE = dict(top=13, bottom=24, left=5, right=11)  # % of frame; rough Reels/Shorts/TikTok UI keep-out (third-party guidance)
TARGET, HOOK_S = (15, 30), 3
FIELDS = (("sees", "Sees"), ("motion", "Motion"), ("text", "Text"), ("sound", "Sound"), ("transition", "Cut"))

# SHOTS is a top-level const in film.html: reachable by name from evaluate(), not via window
READ_SHOTS = r"""() => {
  if (typeof SHOTS === 'undefined') return null;
  const text = id => {
    const el = document.getElementById(id), out = [];
    if (!el) return '';
    for (const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); w.nextNode();) {
      const s = w.currentNode.textContent.replace(/\s+/g, ' ').trim(); if (s) out.push(s);
    }
    return out.join(' / ');
  };
  return { T: window.T ?? null, shots: SHOTS.map(([id, a, b]) => ({ id, a, b, text: text(id) })) };
}"""


async def open_page(p, film):
    b = await p.chromium.launch()
    pg = await b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(film.resolve().as_uri())
    await pg.wait_for_function("window.ready === true", timeout=60000)
    await pg.add_style_tag(content="*,*::before,*::after{transition:none!important}#hud{display:none}")
    await pg.evaluate("document.getAnimations().forEach(a => a.pause())")
    return b, pg, errs


def num(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def cell(s):
    return str(s).replace("|", "\\|").strip()


# ---- markdown <-> beats ----

def col_key(c):
    c = c.lower()
    for sub, key in (("start", "time"), ("see", "sees"), ("motion", "motion"), ("text", "text"), ("sound", "sound"), ("transition", "transition")):
        if sub in c: return key
    return "n" if "#" in c else c


def split_row(line):
    return [c.replace("\\|", "|").strip() for c in re.split(r"(?<!\\)\|", line.strip().strip("|"))]


def parse(md):
    """-> (header dict, beats). Beat = {n, a, b, mid, sees, motion, text, sound, transition}."""
    head, rows, cols = {}, [], None
    for line in md.splitlines():
        s = line.strip()
        if s.startswith("|"):
            cells = split_row(s)
            if cols is None: cols = [col_key(c) for c in cells]
            elif not re.fullmatch(r"[\s:|-]+", s): rows.append(dict(zip(cols, cells)))
        elif cols is None and s[:1] in "-*" and ":" in s:
            k, _, v = s.lstrip("-* ").replace("**", "").partition(":")
            k = k.strip().lower()
            for name in ("hook check", "sound-off", "hook", "total", "brand", "film"):  # "hook check" before "hook"
                if k.startswith(name): head[name] = v.strip(); break
    if not rows: raise ValueError("no shot table rows found (need a markdown table with a 'start-end (s)' column)")
    beats = []
    for i, r in enumerate(rows, 1):
        m = re.match(r"\s*([\d.]+)\s*[-–—]\s*([\d.]+)", r.get("time", ""))
        if not m: raise ValueError(f"row {i}: cannot read start-end from {r.get('time')!r} (expected like 0-2.5)")
        a, b = float(m[1]), float(m[2])
        if b <= a: raise ValueError(f"row {i}: end {b} is not after start {a}")
        beats.append({"n": i, "a": a, "b": b, "mid": (a + b) / 2, **{k: r.get(k, "") for k, _ in FIELDS}})
    return head, beats


def warnings(beats, total=None):
    w = []
    for p, q in zip(beats, beats[1:]):
        if abs(q["a"] - p["b"]) > 0.05: w.append(f"beat {q['n']} starts at {num(q['a'])} but beat {p['n']} ends at {num(p['b'])}")
    if total and abs(beats[-1]["b"] - total) > 0.05: w.append(f"last beat ends at {num(beats[-1]['b'])}, film length is {num(total)}")
    return w


def skeleton(film_name, T, shots):
    """Fill the template's header and replace its example rows with one row per SHOTS entry (end clipped to T)."""
    out, in_table = [], 0
    for line in TEMPLATE.read_text(encoding="utf-8").splitlines():
        if line.startswith("|"):
            in_table += 1
            if in_table <= 2: out.append(line)
            elif in_table == 3:
                for i, s in enumerate(shots, 1):
                    row = [i, f"{num(s['a'])}-{num(min(s['b'], T))}", f"TODO ({s['id']})", "", s["text"], "", ""]
                    out.append("| " + " | ".join(cell(c) for c in row) + " |")
            continue
        out.append(line.replace("<film name>", film_name)
                       .replace("<films/name>", f"films/{film_name}")
                       .replace("<number; target 15-30, under 15 also works>", f"{num(T)} (target 15-30)"))
    return "\n".join(out) + "\n"


# ---- contact sheet ----

def jpeg_size(b):
    i = 2
    while i < len(b):
        if b[i] != 0xFF: i += 1; continue
        mk = b[i + 1]
        if mk in (0xC0, 0xC1, 0xC2): return int.from_bytes(b[i + 7:i + 9], "big"), int.from_bytes(b[i + 5:i + 7], "big")
        i += 2 + int.from_bytes(b[i + 2:i + 4], "big")
    raise ValueError("no JPEG size marker")


def esc(s):
    return html.escape(s).replace("&lt;br&gt;", "<br>")


def length_verdict(total):
    lo, hi = TARGET
    return "under 15 s" if total < lo else "within 15-30 s" if total <= hi else f"over {hi} s: trim"


CSS = """
:root{--paper:#e4e8ec;--card:#fff;--ink:#1d2430;--dim:#5d6877;--line:#c3cad3;--blue:#3b82c4;--blue-soft:#cfe3f4;--red:#d9402f;--frame:#0d1117}
:root[data-theme=dark]{--paper:#12161c;--card:#1a2029;--ink:#e6eaef;--dim:#93a0b0;--line:#2c3541;--blue:#6aaee8;--blue-soft:#1e3a55;--red:#ff6a57;--frame:#000}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--paper:#12161c;--card:#1a2029;--ink:#e6eaef;--dim:#93a0b0;--line:#2c3541;--blue:#6aaee8;--blue-soft:#1e3a55;--red:#ff6a57;--frame:#000}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.4 system-ui,"Segoe UI",sans-serif}
h1,.sub,.tools,.ticks,.snd,.when,button,.flag,.foot{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace}
.col{max-width:420px;margin:0 auto;padding:0 16px}
header{padding-top:24px;padding-bottom:12px}
h1{margin:0 0 6px;font-size:12px;line-height:1;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)}
h2{margin:0;font-size:28px;line-height:1.1;font-weight:650;letter-spacing:-.02em}
.sub{margin:8px 0 0;font-size:12px;color:var(--dim)}
.sticky{position:sticky;top:0;z-index:5;background:var(--paper);border-bottom:1px solid var(--line);padding:10px 0 4px}
.tools{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dim)}
.tools .t{margin-right:auto;white-space:nowrap}
button{font:600 12px ui-monospace,"Cascadia Mono",Consolas,monospace;padding:7px 10px;border:1px solid var(--red);border-radius:4px;background:transparent;color:var(--red);cursor:pointer}
button[aria-pressed=true],#master{background:var(--red);color:#fff}
button:focus-visible,a:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.bar{position:relative;margin-top:18px;height:30px;background:var(--card);border:1px solid var(--line)}
.seg{position:absolute;top:0;bottom:0;display:flex;align-items:center;padding-left:6px;border-right:1px solid var(--paper);background:var(--blue-soft);color:var(--ink);text-decoration:none;font:600 11px ui-monospace,"Cascadia Mono",Consolas,monospace;overflow:hidden}
.seg:nth-child(even){background:color-mix(in srgb,var(--blue-soft) 55%,var(--card))}
.seg.now{background:var(--blue);color:#fff}
.hookzone{position:absolute;top:-8px;height:8px;border:1px solid var(--red);border-bottom:0}
.head{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;background:var(--red);pointer-events:none}
.ticks{position:relative;height:18px;font-size:10px;color:var(--dim)}
.ticks span{position:absolute;top:0;padding-left:3px;border-left:1px solid var(--line);height:8px;line-height:18px;white-space:nowrap}
main{display:flex;flex-direction:column;gap:30px;padding-top:24px;padding-bottom:28px}
.beat{display:grid;grid-template-columns:minmax(0,54%) minmax(0,1fr);gap:14px;align-items:start;scroll-margin-top:110px}
.frame{position:relative;aspect-ratio:9/16;background:var(--frame);overflow:hidden;border-radius:6px}
.frame img{display:block;width:100%;height:100%;object-fit:cover}
.beat:target .frame,.beat.now .frame{outline:2px solid var(--blue);outline-offset:2px}
.badge{position:absolute;left:6px;top:6px;padding:3px 5px;background:var(--red);color:#fff;font:700 10px/1 ui-monospace,"Cascadia Mono",Consolas,monospace;letter-spacing:.1em}
.safe{display:none;position:absolute;pointer-events:none;border:1px dashed var(--red)}
.safe i{position:absolute;left:4px;top:2px;font:600 10px ui-monospace,"Cascadia Mono",Consolas,monospace;font-style:normal;color:var(--red);background:rgba(0,0,0,.45);padding:0 3px}
body.show-safe .safe{display:block}
.cap{display:flex;flex-direction:column;gap:10px;min-width:0}
.when{margin:0;font-size:12px;color:var(--dim)}
.when b{font-size:26px;line-height:1;color:var(--blue);margin-right:6px}
.txt{margin:0;font-size:17px;line-height:1.25;font-weight:600;overflow-wrap:anywhere}
.txt.long{font-size:13px;line-height:1.3}
.sees{margin:0;font-size:13px;color:var(--dim)}
.snd{margin:0;font-size:12px}
.flag{margin:0;font-size:11px;font-weight:600;color:var(--red)}
.play{align-self:flex-start}
.foot{padding-bottom:40px;font-size:11px;color:var(--dim)}
@media print{button{display:none}.sticky{position:static}.beat{break-inside:avoid}}
"""

JS = """
const $ = s => document.querySelector(s);
const b = $('#safe-toggle');
const set = on => { document.body.classList.toggle('show-safe', on); b.setAttribute('aria-pressed', on); b.textContent = 'Safe zone: ' + (on ? 'on' : 'off'); };
b.onclick = () => set(!document.body.classList.contains('show-safe'));
addEventListener('keydown', e => { if (e.key === 's' && !e.ctrlKey && !e.metaKey) b.click(); });
const a = $('#snd');
if (a) {
  const m = $('#master'), head = $('.head'), clock = $('#clock'), TOTAL = +document.body.dataset.total;
  const beats = [...document.querySelectorAll('.beat')], segs = [...document.querySelectorAll('.seg')];
  m.onclick = () => a.paused ? a.play() : a.pause();
  for (const p of document.querySelectorAll('.play')) p.onclick = () => { a.currentTime = +p.dataset.t; a.play(); };
  const label = () => { m.textContent = a.paused ? '\\u25b6 Play' : '\\u275a\\u275a Pause'; };
  a.onplay = a.onpause = a.onended = label;
  a.ontimeupdate = () => {
    const t = a.currentTime;
    head.style.left = (t / TOTAL * 100) + '%';
    clock.textContent = t.toFixed(1) + ' / ' + TOTAL + ' s';
    beats.forEach((el, i) => { const on = t >= +el.dataset.a && t < +el.dataset.b; el.classList.toggle('now', on); segs[i].classList.toggle('now', on); });
  };
  label();
}
"""

LIMITS = dict(sees=8, sound=4, motion=5, transition=3)  # words; the sheet shows only sees + sound, the rest stay in STORYBOARD.md


def long_cells(beats):
    return [f"beat {b['n']} {k}: {len(b[k].split())} words (max {n})" for b in beats for k, n in LIMITS.items() if len(b[k].split()) > n]


def build_html(film_name, head, beats, imgs, total, audio=None):
    """Self-contained sheet: stills (and the optional mp3 sample) inlined as data URIs. imgs[i] = JPEG bytes for beats[i]."""
    pct = lambda x: f"{x / total * 100:.3f}%"
    step = 1 if total <= 30 else 5
    ticks = "".join(f'<span style="left:{pct(t)}">{t}</span>' for t in range(0, int(total) + 1, step))
    segs = "".join(f'<a class="seg" href="#beat-{b["n"]}" style="left:{pct(b["a"])};width:{pct(b["b"] - b["a"])}" title="{esc(b["text"] or b["sees"])}">{b["n"]}</a>' for b in beats)
    hz = min(HOOK_S, total)
    safe = f'<div class="safe" style="top:{SAFE["top"]}%;bottom:{SAFE["bottom"]}%;left:{SAFE["left"]}%;right:{SAFE["right"]}%"><i>safe</i></div>'
    cards = []
    for b, img in zip(beats, imgs):
        uri = "data:image/jpeg;base64," + base64.b64encode(img).decode()
        badge = '<span class="badge">HOOK</span>' if b["a"] < HOOK_S else ""
        text = "<br>".join(esc(t) for t in b["text"].split(" / ")) if b["text"].strip() else ""
        txt = f'<p class="txt{" long" if len(b["text"].split()) > 10 else ""}">{text}</p>' if text else '<p class="flag">no on-screen text: fails the sound-off check</p>'
        play = f'<button class="play" data-t="{num(b["a"])}" title="Play the soundtrack from {num(b["a"])} s">▶ play from here</button>' if audio else ""
        cards.append(
            f'<article class="beat" id="beat-{b["n"]}" data-a="{num(b["a"])}" data-b="{num(b["b"])}"><div class="frame"><img src="{uri}" width="{W}" height="{H}" alt="Beat {b["n"]} still at {num(b["mid"])} s">{badge}{safe}</div>'
            f'<div class="cap"><p class="when"><b>{b["n"]}</b>{num(b["a"])}–{num(b["b"])} s</p>{txt}'
            f'<p class="sees">{esc(b["sees"])}</p><p class="snd">♪ {esc(b["sound"]) or "—"}</p>{play}</div></article>')
    snd = f'<audio id="snd" preload="auto" src="data:audio/mpeg;base64,{base64.b64encode(audio).decode()}"></audio>' if audio else ""
    master = '<button id="master">▶ Play</button>' if audio else ""
    clock = f'<span class="t" id="clock">0.0 / {num(total)} s</span>' if audio else f'<span class="t">{num(total)} s</span>'
    foot = ("Soundtrack: the film's planned music + SFX from render.py (Mixkit free licence). " if audio else "") + "Full table and notes: STORYBOARD.md"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard {esc(film_name)}</title><style>{CSS}</style></head><body data-total="{num(total)}">
<header class="col"><h1>Storyboard</h1><h2>{esc(film_name)}</h2><p class="sub">{len(beats)} beats · {num(total)} s · {length_verdict(total)}</p></header>
<div class="sticky"><div class="col"><div class="tools">{master}{clock}<button id="safe-toggle" aria-pressed="false" title="Toggle phone UI safe-zone overlay (S)">Safe zone: off</button></div>
<div class="bar" aria-label="Timeline"><div class="hookzone" style="left:0;width:{pct(hz)}" title="first {HOOK_S} s (hook)"></div>{segs}<div class="head" style="left:0"></div></div>
<div class="ticks">{ticks}</div></div></div>
<main class="col">{"".join(cards)}</main>
<p class="foot col">{foot}</p>{snd}
<script>{JS}</script></body></html>
"""


# ---- audio sample ----

def encode_audio(src):
    """-> mp3 bytes (96 kbps stereo) or None. Written to a temp file so the mp3 header carries an exact duration."""
    with tempfile.TemporaryDirectory() as d:
        out = Path(d) / "a.mp3"
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", str(out)], capture_output=True, text=True)
        if r.returncode or not out.exists(): print("audio: ffmpeg failed:", r.stderr.strip()[-200:]); return None
        return out.read_bytes()


def get_audio(film, arg):
    """Sample for the sheet: --audio path, else <film_dir>/out/audio.wav, generated by `render.py audio` when missing. -> mp3 bytes or None (one-line note printed)."""
    src = Path(arg) if arg else film.parent / "out" / "audio.wav"
    if not src.exists() and not arg and (film.parent / "render.py").exists():
        print("audio: out/audio.wav missing, running render.py audio ...")
        r = subprocess.run([sys.executable, "render.py", "audio"], cwd=film.parent, capture_output=True, text=True)
        if r.returncode: print("audio: render.py audio failed:", (r.stderr.strip().splitlines() or ["?"])[-1])
    if not src.exists(): print(f"audio: no player ({src} not found; pass --audio <path> or add an 'audio' step to render.py)"); return None
    return encode_audio(src)


# ---- commands ----

def film_file(film_dir):
    f = Path(film_dir)
    f = f / "film.html" if f.is_dir() else f
    if not f.exists(): sys.exit(f"no film.html at {f}")
    return f


async def read_shots(film):
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, film)
        data = await pg.evaluate(READ_SHOTS)
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:5])
    if not data: sys.exit(f"{film} has no top-level SHOTS array (expected [[id, start, end], ...])")
    if not data["T"]: data["T"] = max(s["b"] for s in data["shots"] if s["b"] < 99)
    return data


def cmd_skeleton(film_dir, md):
    film = film_file(film_dir)
    data = asyncio.run(read_shots(film))
    md = Path(md) if md else film.parent / "storyboard" / "STORYBOARD.md"
    md.parent.mkdir(parents=True, exist_ok=True)
    md.write_text(skeleton(film.parent.name, data["T"], data["shots"]), encoding="utf-8")
    print(f"beats found: {len(data['shots'])} | film length: {num(data['T'])} s | skeleton -> {md}")


async def render_stills(film, beats, stills):
    stills.mkdir(parents=True, exist_ok=True)
    out = []
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, film)
        T = await pg.evaluate("window.T ?? null")
        stage = await pg.query_selector("#stage")
        for bt in beats:
            t = min(bt["mid"], (T or 1e9) - 1e-3)
            await pg.evaluate(f"window.seek({t})")
            await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            path = stills / f"beat_{bt['n']:02d}.jpg"
            await stage.screenshot(path=str(path), type="jpeg", quality=90)
            out.append(path.read_bytes())
        await b.close()
    if errs: print("PAGE ERRORS:", errs[:5])
    return out, T


def cmd_sheet(film_dir, md, out, audio_arg=None):
    film = film_file(film_dir)
    out = Path(out) if out else film.parent / "storyboard"
    md = Path(md) if md else out / "STORYBOARD.md"
    if not md.exists(): sys.exit(f"{md} not found: run 'skeleton' first or copy templates/STORYBOARD.template.md")
    head, beats = parse(md.read_text(encoding="utf-8"))
    imgs, T = asyncio.run(render_stills(film, beats, out / "stills"))
    m = re.search(r"[\d.]+", head.get("total", ""))
    total = float(m[0]) if m else (T or beats[-1]["b"])
    for w in warnings(beats, total): print("WARN:", w)
    name = head.get("film", "").split("/")[-1] or film.parent.name
    for w in long_cells(beats): print("WARN: too long for the sheet:", w)
    audio = get_audio(film, audio_arg)
    sheet = out / "storyboard.html"
    sheet.write_text(build_html(name, head, beats, imgs, max(total, beats[-1]["b"]), audio), encoding="utf-8")
    w, h = jpeg_size(imgs[0])
    print(f"beats: {len(beats)} | stills written: {len(imgs)} at {w}x{h} px -> {out / 'stills'}")
    print(f"contact sheet -> {sheet} ({sheet.stat().st_size / 1e6:.2f} MB, audio {'embedded' if audio else 'none'})")


def selfcheck():
    tpl = TEMPLATE.read_text(encoding="utf-8")
    head, beats = parse(tpl)
    assert len(beats) == 4 and beats[0]["mid"] == 1.5 and beats[1]["a"] == 3, beats
    assert head["hook check"].startswith("by 3 s") and head["sound-off"].startswith("mute"), head
    assert warnings(beats, 18) == [] and warnings(beats, 20), "gap/length warnings"
    _, b = parse("| # | Start-End (s) | what the viewer sees | on-screen text |\n|--|--|--|--|\n| 1 | 0.5 – 2 | a \\| b | hi |")
    assert (b[0]["a"], b[0]["b"], b[0]["sees"], b[0]["text"]) == (0.5, 2.0, "a | b", "hi"), b
    sk = skeleton("demo", 16.5, [{"id": "s0", "a": 0, "b": 2.0013, "text": "skin feeling / off-balance?"}, {"id": "s1", "a": 2.0013, "b": 99, "text": ""}])
    h2, b2 = parse(sk)
    assert [(x["a"], x["b"]) for x in b2] == [(0, 2), (2, 16.5)] and b2[0]["text"] == "skin feeling / off-balance?" and h2["total"].startswith("16.5"), (h2, b2)
    jpg = bytes.fromhex("ffd8ffc00011080008001000000000000000ffd9")  # SOI + SOF0 height 8, width 16
    assert jpeg_size(jpg) == (16, 8)
    page = build_html("demo", h2, b2, [jpg, jpg], 16.5)
    assert page.count("<img ") == 2 and 'id="safe-toggle"' in page and "no on-screen text" in page and page.count('class="seg"') == 2
    assert "<audio" not in page and 'class="play"' not in page
    page = build_html("demo", h2, b2, [jpg, jpg], 16.5, b"ID3")
    assert 'src="data:audio/mpeg;base64,' in page and page.count('class="play"') == 2 and 'data-t="2"' in page and 'id="master"' in page
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "t.wav"
        with wave.open(str(wav), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000); w.writeframes(b"\x00\x10" * 4000)
        mp3 = get_audio(wav.parent / "film.html", str(wav))
        assert mp3 and (mp3[:3] == b"ID3" or mp3[0] == 0xFF), "audio encode"
        assert get_audio(wav.parent / "film.html", None) is None  # nothing to embed -> note, no player
    assert long_cells(b2) == [] and len(long_cells([{"n": 1, **{k: "w " * 20 for k in LIMITS}}])) == 4
    assert length_verdict(12) == "under 15 s" and length_verdict(16.5) == "within 15-30 s" and length_verdict(40).startswith("over")
    print("storyboard selfcheck: ok")


if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda f: a[a.index(f) + 1] if f in a else None
    if a[:1] == ["selfcheck"]: selfcheck()
    elif a[:1] == ["skeleton"] and len(a) > 1: cmd_skeleton(a[1], opt("--md"))
    elif a[:1] == ["sheet"] and len(a) > 1: cmd_sheet(a[1], opt("--md"), opt("--out"), opt("--audio"))
    else: print(__doc__)
