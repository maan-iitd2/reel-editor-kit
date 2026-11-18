// effects/lib/title-pills.js
// doc: two stacked white pills top-left ("20 video effects in 20 seconds / built by Claude"); present from the first frame,
//   dims and leaves at ~1.93-2.07 s. Source: reel DfnvcS1OdZi 0.00-2.07 s (G2). Intentionally sits in the IG top zone (y 186-339).
K.register('title-pills', {
  needs: [],
  doc: 'white two-line title pills, top-left, fade out after ~2 s',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'top'), o = Object.assign({ out: 1.93, gone: 2.07, l1: '20 video effects in 20 seconds', l2: 'built by <span style="color:#183727">Claude</span>' }, opts);
    const css = 'background:#FBFCFB;color:#010202;font:600 47px/77px Inter,Arial,sans-serif;text-align:center;border-radius:15px;letter-spacing:-.025em;white-space:nowrap;transform:translateX(-50%);padding:0 24px;';
    const a = SK.el('div', css + 'left:390px;top:186px;height:77px', L, o.l1);
    const b = SK.el('div', css + 'left:390px;top:265px;height:74px;line-height:74px', L, o.l2);
    return { seek(t) { const k2 = SK.ramp(t, o.out, o.gone), k1 = SK.ramp(t, o.out + .04, o.gone + .02);
      a.style.opacity = 1 - k1; b.style.opacity = 1 - k2; a.style.filter = b.style.filter = `brightness(${1 - .22 * Math.max(k1, k2)})`;
      a.style.display = k1 >= 1 ? 'none' : 'block'; b.style.display = k2 >= 1 ? 'none' : 'block'; } };
  },
});
