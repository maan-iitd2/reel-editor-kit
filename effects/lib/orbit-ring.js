// effects/lib/orbit-ring.js
// doc: the letters of a phrase circle the head on a tilted ellipse: far-arc letters pass BEHIND the person, near-arc letters in
//   FRONT; depth sets size, tint and opacity; the ring contracts and fades at the end. Trigger: "orbit ring". Needs the person matte.
//   Source: reel DfnvcS1OdZi 4.70-5.73 s (E05). Ring centre ~ (400,830), rx 270, ry 150, tilt -8 deg; letters ~45-90 px, Instrument Serif caps.
K.register('orbit-ring', {
  needs: ['subject'],
  doc: 'phrase letters orbit the head (behind / in front)',
  create(stage, opts) {
    const LB = SK.layer(stage, Object.assign({}, opts), 'behind'), LF = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 4.70, out: 5.50, gone: 5.73, text: 'ORBIT RING', cx: 560, cy: 790, rx: 430, ry: 170, tilt: -8, rev: 1.1, a0: 3.6 }, opts);
    const chars = [...o.text].map((c, i) => ({ c, i })).filter(x => x.c !== ' '); const n = [...o.text].length;
    const els = chars.map(x => SK.el('div', `left:0;top:0;font:400 130px/130px ${F.serif};color:#EDEBDD;white-space:nowrap;margin:-65px 0 0 -42px;width:84px;text-align:center`, LF, x.c));
    return { seek(t) {
      const live = t >= o.t0 && t < o.gone; els.forEach(e => e.style.display = live ? 'block' : 'none'); if (!live) return;
      const k = K.step(t - o.t0, 150, 20), ex = SK.sm((t - o.out) / (o.gone - o.out)), ph = (t - o.t0) / .95 * Math.PI * 2 * o.rev / 1.0, tl = o.tilt * Math.PI / 180;
      els.forEach((e, j) => { const idx = chars[j].i, a = o.a0 + idx / n * Math.PI * 2 - ph * .9, R = (0.45 + .55 * K.clamp(k, 0, 1.05)) * (1 - .55 * ex);
        const ex_ = Math.cos(a) * o.rx * R, ey = Math.sin(a) * o.ry * R, z = Math.sin(a);     // z>0 near
        const x = o.cx + ex_ * Math.cos(tl) - ey * Math.sin(tl), y = o.cy + ex_ * Math.sin(tl) + ey * Math.cos(tl) + 18 * z;
        const s = .62 + .38 * (z + 1) / 2, near = z > 0; const par = near ? LF : LB; if (e.parentNode !== par) par.appendChild(e);
        const tint = (z + 1) / 2; e.style.color = `rgb(${237 - 21 * tint | 0},${235 - 30 * tint | 0},${221 - 61 * tint | 0})`;
        e.style.opacity = K.clamp(k * 1.5) * (1 - ex) * (.55 + .45 * (z + 1) / 2); e.style.transform = `translate(${x}px,${y}px) scale(${s})`; e.style.zIndex = Math.round((z + 1) * 10); });
    } };
  },
});
