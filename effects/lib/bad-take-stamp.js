// bad-take-stamp: mono caps tape stamps (cream fill, pink-red border and text) that slam in with a heavy overshoot and a hard shadow.
// Trigger: the word it labels ("bad", "takes"); DEAD AIR then CUT. Source: justyn.ai DfbHxfMNsOr FEATURES F10 (DEAD AIR 249x62, CUT 117x62, #D2646E on #F3E6DD).
// opts: {layer, stamps:[{text, x, y (centre), t0, t1, rot, size}]}
K.register('bad-take-stamp', {
  needs: [], doc: 'DEAD AIR / CUT mono stamps that slam in (scale 1.6 to 1 with overshoot)',
  create(stage, o) {
    const { P, F, el } = K.kit, host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const st = o.stamps.map(s => ({ s, d: el('div', `position:absolute;left:${s.x}px;top:${s.y}px;padding:6px 26px 8px;border:7px solid ${P.pink};border-radius:12px;background:${P.pinkBg};color:${P.pink};font:700 ${s.size || 66}px/1 ${F.mono};letter-spacing:.04em;white-space:nowrap;box-shadow:0 8px 0 rgba(0,0,0,.28);display:none`, host, s.text) }));
    return { seek(t) { st.forEach(({ s, d }) => { const on = t >= s.t0 && t < s.t1 + 0.05; d.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, s.t0, [380, 20]), x = K.sp(t, s.t1 - 0.05, K.P.OUT), sc = 1.65 - 0.65 * e;
      d.style.opacity = K.clamp(e * 4) * (1 - x); d.style.transform = `translate(-50%,-50%) rotate(${(s.rot || -2) * (1 + (1 - e) * 2)}deg) scale(${sc})`; }); } }; },
});
