// pip-recursion: the video plays inside itself: a small white-bordered picture-in-picture (the film's own frames, with a smaller copy nested in its corner) pops in at the top-left,
// then expands to the full frame while the shot behind cuts and blurs; the inner picture and the film agree at the end so the swap is seamless.
// Trigger: "you get exactly what you're seeing now" (pops on "exactly", expands on "seeing"). Source: justyn.ai DfbHxfMNsOr FEATURES F12.
// Deterministic recursion: pass 1 renders the film WITHOUT this module (pip.html variant or opts.src null), ffmpeg dumps its frames to jpg, pass 2 plays them in the window.
// opts: {t0, tExpand, tEnd, src:(frameIndex)=>url|null, from:first frame index available, rect:[x,y,w] (start window, 9:16), layer}
K.register('pip-recursion', {
  needs: ['full'], doc: 'picture-in-picture of the film itself (pass-1 frames), nested copy, expands to full frame',
  create(stage, o) {
    const { P, el } = K.kit, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const [rx, ry, rw] = o.rect || [60, 260, 300], rh = rw * 16 / 9;
    const win = el('div', 'position:absolute;overflow:hidden;border:3px solid #fff;box-sizing:border-box;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)', host);
    const img = el('img', 'position:absolute;left:0;top:0;width:100%;height:100%', win);
    const nest = el('div', 'position:absolute;left:3%;top:2.5%;width:28%;height:28%;border:2px solid #fff;box-sizing:border-box;overflow:hidden', win), nimg = el('img', 'position:absolute;inset:0;width:100%;height:100%', nest);
    let last = -1;
    return { async seek(t) {
      const on = o.src && t >= o.t0 - 0.02 && t < o.tEnd; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const fi = Math.round(t * 30); if (fi !== last) { last = fi; const u = o.src(Math.max(o.from || 0, fi - 3)); if (u) { img.src = u; nimg.src = u; await img.decode().catch(() => {}); } }
      const pop = K.sp(t, o.t0, K.P.UI), ex = K.clamp((t - o.tExpand) / (o.tEnd - o.tExpand)), ee = 1 - Math.pow(1 - ex, 2.6);
      const W = K.lerp(rw, 1080, ee) * (0.5 + 0.5 * Math.min(1.05, pop)), H = K.lerp(rh, 1920, ee) * (0.5 + 0.5 * Math.min(1.05, pop));
      win.style.left = K.lerp(rx, 0, ee) + 'px'; win.style.top = K.lerp(ry, 0, ee) + 'px'; win.style.width = W + 'px'; win.style.height = H + 'px';
      win.style.borderWidth = (3 * (1 - ee)) + 'px'; win.style.opacity = K.clamp(pop * 2); nest.style.opacity = 1 - ee; } }; },
});
