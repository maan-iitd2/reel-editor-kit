// effects/lib/step-pill.js
// doc: dark-green step caption pill with a mono step number, a title and a 3-segment progress bar; the title wipes in
//   from the left on each step. Trigger: use with video-backdrop (one step per backdrop). opts.steps = [{t, n, title}], out.
//   Source: reel DfnvcS1OdZi 17.03-18.15 s (G4). Pill x 288-790, y 1200-1315 (src 192-527 x 800-877).
K.register('step-pill', {
  needs: [],
  doc: 'step caption pill with progress segments ("01 The raw take")',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ steps: [{ t: 17.03, n: '01', title: 'The raw take' }, { t: 17.45, n: '02', title: 'The storyboard' }, { t: 17.78, n: '03', title: 'The finished reel' }], out: 18.15, x: 288, y: 1200 }, opts);
    const p = SK.el('div', `left:${o.x}px;top:${o.y}px;width:502px;height:112px;border-radius:22px;background:#1C3C2C;box-shadow:0 10px 28px rgba(0,0,0,.4);overflow:hidden`, L);
    const num = SK.el('div', `left:26px;top:20px;font:500 22px/44px ${F.mono};color:#C7B77E`, p, '');
    const clip = SK.el('div', 'left:84px;top:20px;width:400px;height:44px;overflow:hidden', p);
    const title = SK.el('div', `left:0;top:0;font:600 33px/44px ${F.ui};color:#F3FEF4;white-space:nowrap;letter-spacing:-.01em`, clip, '');
    const segs = [0, 1, 2].map(i => { const tr = SK.el('div', `left:${26 + i * 150}px;top:84px;width:140px;height:5px;border-radius:3px;background:#2E4A3A;overflow:hidden`, p); return SK.el('div', 'left:0;top:0;height:5px;background:#F4FCF4;width:0', tr); });
    return { seek(t) {
      let s = -1; o.steps.forEach((st, i) => { if (t >= st.t) s = i; }); const live = s >= 0 && t < o.out + .05; p.style.display = live ? 'block' : 'none'; if (!live) return;
      const st = o.steps[s], k = K.sp(t, st.t, K.P.UI), a = K.sp(t, o.steps[0].t, K.P.UI);
      num.textContent = st.n; title.textContent = st.title; title.style.transform = `translateX(${(1 - K.clamp(k, 0, 1.05)) * -60}px)`; clip.style.opacity = K.clamp(k * 1.5);
      p.style.opacity = K.clamp(a) * (1 - SK.ramp(t, o.out, o.out + .05)); p.style.transform = `translateY(${(1 - K.clamp(a, 0, 1.1)) * 50}px)`;
      segs.forEach((g, i) => { g.style.width = (i < s ? 140 : i === s ? 140 * SK.sm((t - st.t) / (s === 0 ? .4 : .3)) : 0) + 'px'; });
    } };
  },
});
