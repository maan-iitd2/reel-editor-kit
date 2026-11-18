"""Render the shark rig to PNG frames (RGBA for the shark layer). Run with C:\\Python314\\python.exe.
  probe <cfg.json> <layer> t1 t2 ...        -> out/probe_<layer>.png (contact sheet)
  frames <cfg.json> <layer> <outdir> [a b]  -> <outdir>/%05d.png for frames a..b-1 (default: all)
layer = shark (transparent background) | room | both
Serves this folder over a local HTTP server because ES modules can't load from file://.
"""
import asyncio, functools, http.server, json, subprocess, sys, threading
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
ARGS = ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-unsafe-swiftshader",
        "--font-render-hinting=none", "--force-color-profile=srgb"]


def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(HERE))
    h = type("Quiet", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None}); h = functools.partial(h, directory=str(HERE))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


async def page(p, cfg, layer):
    cf = json.loads((HERE / cfg).read_text())
    w, h = cf.get("size", [1080, 1920])
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={"width": w, "height": h})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    await pg.goto(f"http://127.0.0.1:{PORT}/shark.html?cfg={cfg}&layer={layer}")
    await pg.wait_for_function("window.ready === true", timeout=120000)
    return b, pg, errs, cf


async def shot(pg, t, path):
    await pg.evaluate(f"window.seek({t})")
    await (await pg.query_selector("#c")).screenshot(path=str(path), omit_background=True)


async def probe(cfg, layer, times):
    d = HERE / "out" / "probe"; d.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b, pg, errs, _ = await page(p, cfg, layer)
        gl = await pg.evaluate("(() => { const g = document.createElement('canvas').getContext('webgl2'); const x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()")
        for i, t in enumerate(times): await shot(pg, t, d / f"{layer}_{i:02d}.png")
        await b.close()
    print("GL:", gl, "| errors:", errs[:4] or "none")
    n = len(times)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(d / f"{layer}_%02d.png"), "-vf",
                    f"scale=360:-1,pad=iw+8:ih+8:4:4:color=0x777777,tile={n}x1", "-frames:v", "1", str(HERE / "out" / f"probe_{layer}.png")], check=True)
    print("sheet ->", HERE / "out" / f"probe_{layer}.png")


async def frames(cfg, layer, outdir, a=None, b_=None):
    out = Path(outdir); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b, pg, errs, cf = await page(p, cfg, layer)
        fps, n = cf.get("fps", 30), int(round(cf["duration"] * cf.get("fps", 30)))
        a, b_ = a or 0, b_ or n
        for i in range(a, b_):
            await shot(pg, i / fps, out / f"{i:05d}.png")
            if (i - a) % 60 == 0: print(f"{layer} frame {i}/{b_}", flush=True)
        await b.close()
    print("done", outdir, "| errors:", errs[:4] or "none")


if __name__ == "__main__":
    PORT = serve()
    cmd, cfg, layer = sys.argv[1], sys.argv[2], sys.argv[3]
    if cmd == "probe": asyncio.run(probe(cfg, layer, [float(x) for x in sys.argv[4:]]))
    elif cmd == "frames": asyncio.run(frames(cfg, layer, sys.argv[4], *[int(x) for x in sys.argv[5:7]]))
