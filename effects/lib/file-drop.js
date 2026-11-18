// effects/lib/file-drop.js
// doc: a dashed "Drop raw footage" zone fades in over the chest, a white file card (name + size) drops into it, the card morphs
//   into a RAW video thumbnail of the footage with a "0:32 of raw footage" pill. Trigger: "file drop".
//   Source: reel DfnvcS1OdZi 15.80-17.00 s (E13). Zone x 63-690, y 282-940. Needs opts.foot (live composite of the footage).
K.register('file-drop', {
  needs: ['full'],
  doc: 'drop-zone, file card, raw-footage thumbnail with duration pill',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 15.90, zoneOut: 16.30, card: 16.30, morph: 16.57, thumb: 16.67, out: 17.0, file: '2026-11-10<br>13-34-12.mov', meta: '0:32 &middot; 25.3 MB &middot; 3840&times;2160', dur: '0:32' }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', L);
    const zone = SK.el('div', `left:63px;top:282px;width:627px;height:658px;box-sizing:border-box;border-radius:30px;background:#183727;border:3px dashed #9AA27C`, root,
      `<svg style="position:absolute;left:274px;top:252px" width="80" height="80" viewBox="0 0 80 80"><path d="M40 12 V50 M24 36 L40 52 L56 36 M14 56 V68 H66 V56" stroke="#C7B77E" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    SK.el('div', `left:0;top:352px;width:621px;text-align:center;font:500 34px/44px ${F.ui};color:#F3FEF4`, zone, 'Drop raw footage');
    const card = SK.el('div', `left:95px;top:640px;width:563px;height:150px;border-radius:24px;background:#fff;box-shadow:0 14px 36px rgba(0,0,0,.45)`, root);
    const th = SK.el('canvas', 'left:18px;top:18px;width:84px;height:114px;border-radius:12px', card); th.width = 84; th.height = 114;
    SK.el('div', `left:124px;top:22px;font:600 31px/38px ${F.ui};color:#111;letter-spacing:-.01em`, card, o.file);
    SK.el('div', `left:124px;top:104px;font:500 17px/24px ${F.mono};color:#8A8A8A`, card, o.meta);
    const big = SK.el('div', 'left:190px;top:322px;width:468px;height:568px;border-radius:30px;overflow:hidden;border:3px solid #F3F1E6;box-shadow:0 18px 44px rgba(0,0,0,.5);background:#000', root);
    const bc = SK.el('canvas', 'left:0;top:0;width:462px;height:562px', big); bc.width = 462; bc.height = 562;
    SK.el('div', `right:16px;top:14px;font:700 18px/24px ${F.mono};color:#fff;letter-spacing:.14em;padding:2px 10px;border-radius:8px;background:rgba(0,0,0,.45)`, big, 'RAW');
    const pill = SK.el('div', `left:225px;top:962px;width:300px;height:46px;border-radius:23px;background:#fff;font:600 27px/46px ${F.ui};color:#111;text-align:center;white-space:nowrap`, root, `<span style="color:#C0392B">${o.dur}</span> of raw footage`);
    const cx = th.getContext('2d'), bx = bc.getContext('2d');
    return { seek(t) {
      const live = t >= o.t0 && t < o.out; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const zi = K.sp(t, o.t0, K.P.UI), zo = SK.ramp(t, o.zoneOut, o.zoneOut + .1);
      const zf = SK.ramp(t, o.morph, o.morph + .08); zone.style.opacity = K.clamp(zi) * (1 - zf); zone.style.transform = `scale(${.94 + .06 * K.clamp(zi, 0, 1.05)})`; zone.style.display = zf < 1 ? 'block' : 'none';
      zone.style.background = zo > .5 ? 'rgba(24,55,39,.0)' : '#183727'; zone.style.borderStyle = zo > .5 ? 'solid' : 'dashed'; zone.style.borderColor = zo > .5 ? '#6E8A74' : '#9AA27C'; zone.firstElementChild.style.opacity = 1 - zo; zone.lastElementChild.style.opacity = 1 - zo;
      const ck = K.step(t - o.card, 300, 26), cm = SK.sm((t - o.morph) / .1);
      card.style.display = t >= o.card && cm < 1 ? 'block' : 'none'; card.style.transform = `translateY(${(1 - K.clamp(ck, 0, 1.08)) * -900}px) scale(${1 - .35 * cm})`; card.style.opacity = 1 - cm;
      if (t >= o.card && t < o.morph + .1) { opts.foot.paint(cx, 84, 114); }
      const bk = K.step(t - o.morph, 300, 24); big.style.display = t >= o.morph ? 'block' : 'none'; big.style.opacity = K.clamp(bk * 2); big.style.transform = `scale(${.5 + .5 * K.clamp(bk, 0, 1.06)})`;
      if (t >= o.morph) { const f = document.createElement('canvas'); f.width = 270; f.height = 480; opts.foot.paint(f.getContext('2d'), 270, 480); bx.drawImage(f, 22, 60, 226, 270, 0, 0, 462, 562); }
      const pk = K.sp(t, o.thumb, K.P.UI); pill.style.opacity = K.clamp(pk); pill.style.transform = `translateY(${(1 - K.clamp(pk, 0, 1.1)) * 20}px)`; pill.style.display = t >= o.thumb ? 'block' : 'none';
    } };
  },
});
