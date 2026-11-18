// effects/lib/cta-stack.js
// doc: the CTA caption: three stacked white pills, heavy sans, "EDIT" in brand green; lines land on their spoken words and all
//   leave together. Source: reel DfnvcS1OdZi 11.10-13.43 s (G5). Pills sit at y 1182-1448 (62-75% down, clear of the IG bottom 420).
K.register('cta-stack', {
  needs: [],
  doc: 'three-line white pill CTA caption ("Comment EDIT / to get access to these / + 50 more effects")',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front');
    const o = Object.assign({ times: [11.10, 11.40, 12.30], out: 13.40, lines: ['Comment <span style="color:#183727">EDIT</span>', 'to get access to these', '+ 50 more effects'] }, opts);
    const ys = [1182, 1270, 1358];
    const els = o.lines.map((h, i) => { const d = SK.el('div', `left:0;width:1080px;top:${ys[i]}px;height:90px;display:flex;justify-content:center`, L);
      const p = SK.el('div', `position:relative;background:#fff;color:#0A0A0A;border-radius:18px;padding:0 24px;height:88px;font:600 58px/88px ${SK.FONT.ui};letter-spacing:-.025em;-webkit-text-stroke:1.4px #0A0A0A;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.25)`, d, h);
      return { d, p }; });
    return { seek(t) { els.forEach((e, i) => { const a = o.times[i], k = K.sp(t, a, K.P.UI) * (1 - SK.ramp(t, o.out, o.out + .07));
      const ghost = t >= a && t < a + .07 ? .6 : 1; e.d.style.opacity = t < a ? 0 : K.clamp(k) * ghost; e.p.style.transform = `scale(${.92 + .08 * K.clamp(k, 0, 1.1)})`; e.p.style.filter = ghost < 1 ? 'blur(2px)' : 'none'; }); } };
  },
});
