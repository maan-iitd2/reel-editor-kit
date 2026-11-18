// storyboard-doc: a cream "claude-editing / storyboard" document window slides up, scrolls fast (motion-blurred) through beat cards to a focus card, then the rest dims
// (spotlight) while the quote, one bullet and two table rows stay white and gold underlines draw in; slides away on the whip.
// Trigger: "a storyboard ... so I can see what Claude is thinking". Source: justyn.ai DfbHxfMNsOr FEATURES F17 (window 957x519 of 1276, page #F7F0E9, dim #6A7169, gold underline).
// Not the storyboard-deck slug (other reel); this is the in-reel UI. opts: {t0, tScroll:[a,b], tDim, t1, beats:[{id,time,label,quote,bullet,rows}], focus:index, thumbs:{room,shark}, layer}
K.register('storyboard-doc', {
  needs: [], doc: 'storyboard document window: slide up, fast scroll to the focus beat, spotlight dim with gold underlines, slide away',
  create(stage, o) {
    const { P, F, el } = K.kit, X = 50, Y = 300, W = 900, H = 900, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const win = el('div', `position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:${H}px;border-radius:14px;overflow:hidden;background:${P.doc};box-shadow:0 30px 90px rgba(0,0,0,.6)`, host);
    const bar = el('div', `position:absolute;left:0;right:0;top:0;height:46px;background:#EFE6D8;border-bottom:1px solid #d8cfc0;font:500 18px/46px ${F.mono};color:#2a2925;z-index:3`, win);
    el('span', 'position:absolute;left:20px', bar, 'claude-editing / storyboard'); el('span', 'position:absolute;right:20px;color:#7a746a', bar, 'v2 · ' + o.beats.length + ' beats');
    const sc = el('div', 'position:absolute;left:0;right:0;top:46px;will-change:transform', win);
    el('div', `padding:30px 40px 10px;font:500 15px ${F.mono};letter-spacing:.14em;color:#8a8478`, sc, 'STORYBOARD · V2 · 0:52.9 · ' + o.beats.length + ' BEATS');
    el('div', `padding:0 40px;font:italic 400 92px/1.05 ${F.disp};color:#1f3a2b`, sc, 'Claude Editing');
    el('div', `padding:12px 40px 0;font:400 25px/1.4 ${F.gar};color:#4a463f`, sc, 'Every frame here is a real snapshot of the edit as built. Leave a comment on any beat you want changed. Nothing renders until you approve.');
    const strip = el('div', 'margin:24px 40px;height:34px;display:flex;gap:3px', sc); for (let i = 0; i < 30; i++) el('div', `flex:${1 + (i * 7) % 3};background:${i === 12 || i === 22 ? '#1f3a2b' : i % 4 ? '#8c8469' : '#cfc7b3'}`, strip);
    const cards = o.beats.map((b, i) => { const c = el('div', `margin:0 40px 22px;padding:22px 26px;background:#FBF6EE;border:1px solid #e2d9c8;border-radius:10px;height:360px;box-sizing:border-box;position:relative`, sc);
      el('div', `font:500 17px ${F.mono};color:#3a362f;margin-bottom:12px`, c).innerHTML = `<b>${b.id}</b>&nbsp; ${b.time} &nbsp;<span style="background:#e7dfcd;padding:2px 8px;border-radius:4px">${b.label}</span>`;
      const th = el('div', 'display:flex;gap:14px;margin-bottom:14px', c); const t1 = el('div', `width:104px;height:150px;border-radius:6px;background:#111 url(${o.thumbs.room}) 50% 20%/104px auto;position:relative`, th); el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 20%/104px auto`, t1);
      const t2 = el('div', `width:230px;height:150px;border-radius:6px;background:#111 url(${o.thumbs.room}) 50% 14%/230px auto;position:relative`, th); el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 14%/230px auto`, t2);
      const q = el('div', `font:italic 400 31px/1.2 ${F.gar};color:#1f1d19;display:inline-block;border-bottom:3px solid transparent`, c, '“' + b.quote + '”');
      const bl = b.bullet ? el('div', `font:400 24px/1.35 ${F.ui};color:#2a2925;margin-top:12px;display:inline-block;border-bottom:3px solid transparent`, c, '• ' + b.bullet) : null;
      const rows = (b.rows || []).map(r => { const d = el('div', `margin-top:6px;font:400 22px/1.5 ${F.ui};color:#2a2925;padding:0 8px;margin-left:-8px`, c); el('span', `display:inline-block;width:150px;font:500 17px ${F.mono};color:#6a6559;letter-spacing:.12em`, d, r[0]); el('span', 'display:inline-block;border-bottom:3px solid transparent', d, r[1]); return d; });
      return { c, q, bl, rows }; });
    const dim = el('div', `position:absolute;left:0;right:0;top:46px;bottom:0;background:rgba(12,30,22,.55);opacity:0;z-index:2`, win);
    const vis = [];
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.15; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, [380, 28]), x = K.sp(t, o.t1 - 0.05, [500, 38]);
      win.style.opacity = K.clamp(e * 2.2) * (1 - K.clamp(x * 1.1)); win.style.transform = `translateY(${(1 - e) * 700 + x * 800}px)`;
      const head = 400, per = 382, tgt = head + (o.focus) * per - 40, p = K.clamp((t - o.tScroll[0]) / (o.tScroll[1] - o.tScroll[0])), pe = 1 - Math.pow(1 - p, 3), y = tgt * pe, vel = Math.abs(3 * Math.pow(1 - p, 2)) * tgt / (o.tScroll[1] - o.tScroll[0]) * (p < 1 && p > 0 ? 1 : 0);
      sc.style.transform = `translateY(${-y}px)`; sc.style.filter = vel > 400 ? `blur(${Math.min(7, vel / 900)}px)` : 'none';
      const d = K.clamp((t - o.tDim) / 0.2); dim.style.opacity = d; const f = cards[o.focus]; f.c.style.position = 'relative'; f.c.style.zIndex = d > 0 ? 3 : 0; f.c.style.background = '#fff';
      const ul = (el_, k) => { el_.style.borderBottomColor = P.gold; el_.style.borderImage = `linear-gradient(90deg,${P.gold} ${K.clamp((t - o.tDim - k) / 0.35) * 100}%,transparent 0) 1`; };
      ul(f.q, 0.25); if (f.bl) ul(f.bl, 0.5); f.rows.forEach((r, i) => { r.style.background = i % 2 === 0 ? '#fff' : 'transparent'; if (i % 2 === 0) ul(r.lastChild, 0.75 + i * 0.1); }); } }; },
});
