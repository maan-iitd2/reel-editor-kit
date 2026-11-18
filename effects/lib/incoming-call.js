// effects/lib/incoming-call.js
// doc: an iOS-style "Incoming call" banner drops in at the top-left with a ring-shake, the red button is pressed,
//   a "Call declined" pill pops under it, the banner leaves, then the pill. Trigger: "incoming call".
//   Source: reel DfnvcS1OdZi 19.50-20.55 s (E16). Banner x 33-740, y 234-358 (top zone, as in the source). Colours: #193727, #BA6064, #36BB52.
K.register('incoming-call', {
  needs: [],
  doc: 'incoming call banner (decline pressed) with a "Call declined" pill',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 19.50, press: 19.93, pill: 20.0, bannerOut: 20.17, pillOut: 20.47, name: 'Incoming call', sub: 'mobile' }, opts);
    const ban = SK.el('div', `left:33px;top:234px;width:707px;height:124px;border-radius:30px;background:#193727;border:1.5px solid #38543F;box-shadow:0 12px 30px rgba(0,0,0,.4);transform-origin:50% 0`, L);
    SK.el('div', 'left:28px;top:20px;width:84px;height:84px;border-radius:50%;background:#F3FEF4;overflow:hidden', ban,
      '<svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="33" r="15" fill="#2a3a32"/><ellipse cx="42" cy="84" rx="28" ry="24" fill="#2a3a32"/></svg>');
    SK.el('div', `left:132px;top:24px;font:600 36px/44px ${F.ui};color:#F3FEF4;letter-spacing:-.01em`, ban, o.name);
    SK.el('div', `left:132px;top:68px;font:500 22px/28px ${F.ui};color:#9BB4A4`, ban, o.sub);
    const dec = SK.el('div', `left:513px;top:27px;width:70px;height:70px;border-radius:50%;background:#BA6064`, ban,
      '<svg width="70" height="70" viewBox="0 0 70 70"><path d="M17 40 Q35 28 53 40 L50 46 L42 43 L42 38 Q35 36 28 38 L28 43 L20 46Z" fill="#F3FEF4"/></svg>');
    const acc = SK.el('div', `left:611px;top:27px;width:70px;height:70px;border-radius:50%;background:#36BB52`, ban,
      '<svg width="70" height="70" viewBox="0 0 70 70"><path d="M24 20 L31 19 L35 28 L31 32 Q35 40 41 44 L45 40 L53 45 L52 52 Q40 56 28 44 Q16 32 24 20Z" fill="#fff"/></svg>');
    const pil = SK.el('div', `left:305px;top:372px;width:165px;height:38px;border-radius:19px;background:#1F3729;border:1px solid #38543F`, L);
    SK.el('div', 'left:8px;top:7px;width:24px;height:24px;border-radius:50%;background:#C0524F', pil);
    SK.el('div', `left:40px;top:0;font:500 22px/38px ${F.ui};color:#F3FEF4;white-space:nowrap`, pil, 'Call declined');
    return { seek(t) {
      const dropK = K.step(t - o.t0, 260, 15), bo = 1 - SK.sm((t - o.bannerOut) / .06), live = t >= o.t0 && t < o.bannerOut + .08;
      ban.style.display = live ? 'block' : 'none';
      const ring = t > o.t0 + .05 && t < o.press ? Math.sin((t - o.t0) * 60) * 1.4 * Math.exp(-(t - o.t0) * 1.2) : 0;
      ban.style.transform = `translateY(${(1 - dropK) * -260}px) rotate(${ring}deg)`; ban.style.opacity = bo;
      dec.style.transform = `scale(${t > o.press && t < o.press + .1 ? .88 : 1})`;
      const pk = K.step(t - o.pill, 320, 24), pv = t >= o.pill && t < o.pillOut + .05; pil.style.display = pv ? 'block' : 'none';
      pil.style.opacity = K.clamp(pk) * (1 - SK.ramp(t, o.pillOut, o.pillOut + .05)); pil.style.transform = `translateY(${(1 - K.clamp(pk, 0, 1.1)) * -24}px) scale(${.9 + .1 * K.clamp(pk, 0, 1.1)})`;
    } };
  },
});
