// file-card: the squashed timeline line expands into a green "Drop raw footage" card (grey flash, dashed inner border, download icon), a white file card pops in
// (thumbnail + name + mono meta), then dims as if dropped and fades so the player can grow out of its thumbnail.
// Trigger: "I just drop in the raw footage". Source: justyn.ai DfbHxfMNsOr FEATURES F9 (card 797x425 of 1276, file card 532x116, grey flash at first frame).
// opts: {t0, tFile, tPress, t1, y:640 (centre), thumb:{room,shark}, name:'FullClip.mov', meta:'1:07 · 51.9 MB · 3840×2160'}
K.register('file-card', {
  needs: [], doc: 'drop-zone card with dashed border and a white file card that pops in then dims',
  create(stage, o) {
    const { P, F, el } = K.kit, CW = 860, CH = 560, cy = o.y || 640, host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const card = el('div', `position:absolute;left:${(1080 - CW) / 2}px;top:${cy - CH / 2}px;width:${CW}px;height:${CH}px;border-radius:26px;background:#173027;box-shadow:0 30px 80px rgba(0,0,0,.5)`, host);
    const inner = el('div', `position:absolute;inset:16px;border-radius:16px;border:2px dashed ${P.gold}`, card);
    const lab = el('div', `position:absolute;left:0;right:0;top:${CH / 2 - 50}px;text-align:center;font:500 28px ${F.ui};color:rgba(241,232,220,.85)`, card, 'Drop raw footage');
    el('div', `position:absolute;left:0;right:0;top:${CH / 2 - 100}px;text-align:center;font:400 44px ${F.ui};color:rgba(241,232,220,.7)`, card, '⤓');
    const fc = el('div', `position:absolute;left:80px;top:${CH / 2 - 85}px;width:700px;height:170px;border-radius:20px;background:#FCF9F9;box-shadow:0 18px 40px rgba(0,0,0,.4)`, card);
    const th = el('div', `position:absolute;left:20px;top:20px;width:210px;height:130px;border-radius:10px;overflow:hidden;background:#111 url(${o.thumb.room}) 50% 22%/210px auto no-repeat`, fc);
    el('div', `position:absolute;inset:0;background:url(${o.thumb.shark}) 50% 22%/210px auto no-repeat`, th);
    el('div', `position:absolute;left:262px;top:36px;font:800 40px ${F.ui};color:#111;letter-spacing:-.02em;font-weight:700`, fc, o.name);
    el('div', `position:absolute;left:262px;top:92px;font:500 25px ${F.mono};color:#777`, fc, o.meta);
    return { seek(t) {
      const on = t >= o.t0 - 0.12 && t < o.t1 + 0.1; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const g = K.clamp((t - o.t0) / 0.1), e = K.sp(t, o.t0 - 0.08, [420, 34]), x = K.sp(t, o.t1 - 0.06, K.P.OUT), f = K.sp(t, o.tFile, K.P.UI);
      const flash = 1 - g, c = [23, 48, 39].map((v, i) => Math.round(K.lerp(v, [177, 181, 167][i], flash)));
      card.style.background = `rgb(${c})`; card.style.transform = `scaleY(${0.03 + 0.97 * Math.min(1.04, e)}) scaleX(${0.6 + 0.4 * Math.min(1.04, e)})`; card.style.opacity = 1 - K.clamp(x);
      inner.style.borderStyle = t < o.tFile ? 'dashed' : 'solid'; lab.style.opacity = t < o.tFile - 0.05 && t > o.t0 + 0.08 ? 1 : 0;
      fc.style.opacity = K.clamp(f * 1.8); fc.style.transform = `scale(${0.8 + 0.2 * f})`; fc.style.filter = t >= o.tPress ? 'brightness(.62)' : 'none'; } }; },
});
