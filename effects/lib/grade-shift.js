// grade-shift: the three grade states of the reel (neutral, warm, moody) and the two ways it changes: 'cut' (instant state swap), 'split' (before/after divider that hovers then sweeps
// across, white line + round handle + AFTER tag) and 'topdown' (a thin white edge sweeps top to bottom, crushing the picture dark behind it).
// Trigger: "warms up" (split), "make it moody ... the colors go dark" (topdown). Source: justyn.ai DfbHxfMNsOr FEATURES S4, F5, F13.
// opts: {layers:{over, top}, room:<img>, shark:<img>, start:'neutral', wipes:[{kind:'split'|'topdown', t0, t1, to:'warm'|'moody'|'neutral'}]}
// States: warm = gain 1.13/1.06/0.95, bright x1.1; moody = bright x0.62, gamma 1.5, sat 0.55 (his chest RGB 177,173,173 -> 200,183,165 -> 61,53,55).
K.register('grade-shift', {
  needs: ['subject', 'clean'], doc: 'neutral/warm/moody grade states with split-line and top-down wipes; clones the footage during a wipe',
  create(stage, o) {
    const { F, el } = K.kit, S = {
      neutral: { gain: [1, 1, 1], sat: 1, bright: 1, gamma: 1, vig: .25 },
      warm: { gain: [1.13, 1.06, .95], sat: 1.05, bright: 1.1, gamma: .96, vig: .18 },
      moody: { gain: [.96, 1, 1.06], sat: .55, bright: .62, gamma: 1.5, vig: .6 } };
    const B = el('div', 'position:absolute;inset:0;display:none;overflow:hidden', o.layers.over);
    const ro = el('img', 'position:absolute;inset:0;width:1080px;height:1920px', B), sh = el('img', 'position:absolute;inset:0;width:1080px;height:1920px', B);
    ro.dataset.g = sh.dataset.g = 'kgradeB'; K.foot.els.push(ro, sh);
    const vig = el('div', 'position:absolute;inset:0;background:radial-gradient(ellipse 75% 62% at 50% 46%,rgba(0,0,0,0) 40%,rgba(0,0,0,.9) 100%)', o.layers.over);
    const line = el('div', 'position:absolute;display:none;background:#F7E1D7;box-shadow:0 0 10px rgba(255,255,255,.4)', o.layers.top);
    const handle = el('div', `position:absolute;display:none;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:#173027;border:3px solid rgba(255,255,255,.12);color:#fff;font:600 34px/86px ${F.ui};text-align:center;letter-spacing:-2px`, o.layers.top, '‹ ›');
    const tag = el('div', `position:absolute;display:none;right:150px;top:270px;font:500 22px ${F.mono};letter-spacing:.3em;color:rgba(241,232,220,.8)`, o.layers.top, 'AFTER');
    const wipes = o.wipes.slice().sort((a, b) => a.t0 - b.t0);
    return { async seek(t) {
      let from = S[o.start || 'neutral'], act = null, to = null;
      for (const w of wipes) { if (t >= w.t1 || (w.kind === 'cut' && t >= w.t0)) from = S[w.to]; else if (t >= w.t0) { act = w; to = S[w.to]; break; } else break; }
      let vg = from.vig; B.style.display = 'none'; line.style.display = handle.style.display = tag.style.display = 'none';
      if (act) {
        const u = (t - act.t0) / (act.t1 - act.t0); let clip;
        if (act.kind === 'split') {
          const sw = act.t1 - 0.12, enter = K.sp(t, act.t0, [700, 50]);
          const x = t < sw ? K.lerp(1180, 540, enter) + Math.sin((t - act.t0) * 26) * 14 * (1 - enter * .5) : K.lerp(540, -40, Math.min(1, (t - sw) / 0.12) ** 1.6);
          clip = `inset(0 0 0 ${Math.max(0, x)}px)`; line.style.display = 'block'; line.style.left = (x - 1.5) + 'px'; line.style.top = '0'; line.style.width = '3px'; line.style.height = '1920px';
          handle.style.display = 'block'; handle.style.left = x + 'px'; handle.style.top = '1180px';
          if (t > act.t0 + 0.2 && t < act.t1 + 0.05) tag.style.display = 'block'; }
        else { const e = 1 - Math.pow(1 - K.clamp(u), 2.2), y = -4 + 1930 * e; clip = `inset(0 0 ${Math.max(0, 1920 - y)}px 0)`;
          line.style.display = 'block'; line.style.left = '0'; line.style.top = (y - 1.5) + 'px'; line.style.width = '1080px'; line.style.height = '3px'; }
        B.style.display = 'block'; B.style.clipPath = clip; ro.src = o.room.src; sh.src = o.shark.src; await Promise.all([ro.decode().catch(() => {}), sh.decode().catch(() => {})]);
        K.kit.setGrade('kgradeB', to); vg = K.lerp(from.vig, to.vig, K.clamp(u)); }
      K.kit.setGrade('kgradeA', from); vig.style.opacity = vg;
      K.foot.set('grade', { filter: '@G' }); } };
  },
});
