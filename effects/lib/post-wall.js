// effects/lib/post-wall.js
// doc: a contribution-style wall of day cells fills in behind the person (top-left) while mono counters tick: DAY 058 -> 564 and
//   85 -> 1,711 POSTS. Trigger: "post wall". Needs the person matte (the head overlaps the grid, which sits behind it).
//   Source: reel DfnvcS1OdZi 22.90-24.00 s (E19). Grid x 48-726, y 365-681 (32 x 15 cells). Tones #565840 .. #ECECDC, gold #C1A95E.
K.register('post-wall', {
  needs: ['subject'],
  doc: 'grid of day cells fills in with ticking DAY / POSTS counters, behind the head',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'behind'), F = SK.FONT;
    const o = Object.assign({ t0: 22.90, fill0: 23.0, fill1: 23.5, out: 24.0, days: [58, 564], posts: [85, 1711], cols: 32, rows: 15 }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', L);
    const cv = SK.el('canvas', 'left:48px;top:365px', root); cv.width = 678; cv.height = 316; const g = cv.getContext('2d');
    const hd = SK.el('div', `left:70px;top:246px;font:500 22px/30px ${F.mono};letter-spacing:.14em;color:#9EAA83`, root, 'DAY 058');
    const pc = SK.el('div', `left:0;top:228px;width:726px;text-align:right;font:700 54px/60px ${F.mono};color:#F3FEF4`, root, '85');
    SK.el('div', `left:610px;top:268px;width:110px;text-align:right;font:500 16px/24px ${F.mono};letter-spacing:.2em;color:#9EAA83;display:none`, root, 'POSTS');
    const pl = SK.el('div', `left:0;top:288px;width:726px;text-align:right;font:500 17px/24px ${F.mono};letter-spacing:.22em;color:#9EAA83`, root, 'POSTS');
    SK.el('div', `left:48px;top:689px;font:500 15px/20px ${F.mono};letter-spacing:.14em;color:#7C8F80`, root, '&#9633; NO DATA');
    const rnd = K.mulberry32(58), N = o.cols * o.rows, tone = [];
    const T = ['#565840', '#6C7464', '#747C6C', '#8E9884', '#B9BFAA', '#ECECDC', '#C1A95E'];
    for (let i = 0; i < N; i++) { const r = rnd(); tone.push(r < .08 ? 6 : r < .18 ? 5 : r < .38 ? 4 : r < .6 ? 3 : r < .8 ? 2 : r < .93 ? 1 : 0); }
    const pitch = 678 / o.cols, cell = pitch - 3.4;
    return { seek(t) {
      const live = t >= o.t0 && t < o.out; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const p = SK.ease((t - o.fill0) / (o.fill1 - o.fill0)), n = Math.floor(p * N), a = K.sp(t, o.t0, K.P.UI);
      root.style.opacity = K.clamp(a * 2);
      g.clearRect(0, 0, 678, 316);
      for (let i = 0; i < N; i++) { const c = i % o.cols, r = Math.floor(i / o.cols), on = i < n;
        g.fillStyle = on ? T[tone[i]] : 'rgba(40,52,42,.45)'; if (on && i > n - o.cols * 1.2) g.fillStyle = '#ECECDC'; g.fillRect(c * pitch, r * 21.0, cell, 17.6); }
      const si = Math.max(0, Math.min(4, Math.floor((t - o.fill0) / 0.1 + 1e-6))), day = [58, 159, 297, 467, 564][si], posts = [85, 322, 708, 1359, 1711][si];
      hd.textContent = 'DAY ' + String(day).padStart(3, '0'); pc.textContent = posts.toLocaleString('en-US');
    } };
  },
});
