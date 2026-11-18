// crop-brackets: four gold viewfinder corner brackets with a "1.5x" chip fade in around the subject and expand outward to the frame edges while the shot punches in
// (pair with a punch-in cue at t0+0.2). Trigger: "a tighter cut". Source: justyn.ai DfbHxfMNsOr FEATURES F20 (start inset 0.17 W, end inset 0.05, gold #C7A259, chip "1.5x").
// opts: {t0, t1, a:[x0,y0,x1,y1] start rect, b:[x0,y0,x1,y1] end rect, chip:'1.5×', layer}
K.register('crop-brackets', {
  needs: [], doc: 'gold corner brackets that open outward like a viewfinder with a 1.5x chip',
  create(stage, o) {
    const { P, F, el } = K.kit, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage), A = 70, th = 5;
    const mk = (hx, vy) => { const g = el('div', `position:absolute;width:${A}px;height:${A}px`, host);
      el('div', `position:absolute;${hx}:0;${vy}:0;width:${A}px;height:${th}px;background:${P.gold}`, g); el('div', `position:absolute;${hx}:0;${vy}:0;width:${th}px;height:${A}px;background:${P.gold}`, g); return g; };
    const c = [mk('left', 'top'), mk('right', 'top'), mk('left', 'bottom'), mk('right', 'bottom')];
    const chip = el('div', `position:absolute;padding:3px 12px;background:${P.gold};color:#2d2410;font:700 22px ${F.mono};border-radius:4px`, host, o.chip || '1.5×');
    return { seek(t) {
      const on = t >= o.t0 && t < o.t1 + 0.05; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0 + 0.05, [260, 24]), x = K.clamp((t - (o.t1 - 0.1)) / 0.1), [a0, b0, a1, b1] = o.a, [c0, d0, c1, d1] = o.b;
      const R = [K.lerp(a0, c0, e), K.lerp(b0, d0, e), K.lerp(a1, c1, e), K.lerp(b1, d1, e)];
      c[0].style.left = R[0] + 'px'; c[0].style.top = R[1] + 'px'; c[1].style.left = (R[2] - A) + 'px'; c[1].style.top = R[1] + 'px'; c[2].style.left = R[0] + 'px'; c[2].style.top = (R[3] - A) + 'px'; c[3].style.left = (R[2] - A) + 'px'; c[3].style.top = (R[3] - A) + 'px';
      chip.style.left = (R[0] + 14) + 'px'; chip.style.top = (R[1] + 22) + 'px'; host.style.opacity = K.clamp(K.sp(t, o.t0, K.P.UI) * 2) * (1 - x); } }; },
});
