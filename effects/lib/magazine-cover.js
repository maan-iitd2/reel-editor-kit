// magazine-cover: the frame becomes a magazine cover: gold hairline frame draws on, a heavy Didone masthead slides in letter by letter BEHIND the head (clean occlusion, no green),
// then date line, headline blocks, barcode and a gold seal that stamps in with overshoot; the cover zooms slightly and leaves on the whip.
// Trigger: "the titles look like magazine covers" (starts on "titles"). Source: justyn.ai DfbHxfMNsOr FEATURES F7 (frame 1168x522 of 1276, masthead cap 155, seal r 53).
// opts: {layers:{under,ui}, t0, t1, mast:'CLAUDE', top:'NO. 01 · OCTOBER 2026 · EDITED BY CLAUDE', left:[kicker,line1,line2], right:[kicker,line1,line2], seal:['100%','Claude','EDITED'], y:{mast}}
K.register('magazine-cover', {
  needs: ['subject'], doc: 'portrait magazine cover: framed, Didone masthead behind the head, headline blocks, barcode, gold seal stamp',
  create(stage, o) {
    const { P, F, el } = K.kit, FX = 50, FY = 250, FW = 940, FH = 1230, mastY = o.mastY || 480;
    const U = el('div', 'position:absolute;inset:0', o.layers.under), I = el('div', 'position:absolute;inset:0', o.layers.ui);
    const frame = el('div', `position:absolute;left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px;border:2px solid #B8A06B;box-sizing:border-box`, U);
    const top = el('div', `position:absolute;left:0;width:1080px;top:${FY + 38}px;text-align:center;font:500 22px ${F.mono};letter-spacing:.22em;color:rgba(241,232,220,.8)`, U, o.top);
    const mast = el('div', `position:absolute;left:0;width:1080px;top:${mastY}px;text-align:center;font:700 245px/1 ${F.didone};color:${P.cream};letter-spacing:-.01em;white-space:nowrap`, U);
    const letters = [...o.mast].map(ch => el('span', 'display:inline-block;will-change:transform', mast, ch));
    const blk = (side, arr) => { const b = el('div', `position:absolute;${side}:${side === 'left' ? 90 : 180}px;top:1085px;width:420px;text-align:${side};`, I);
      el('div', `font:500 21px ${F.mono};letter-spacing:.22em;color:${P.gold};margin-bottom:12px`, b, arr[0]); el('div', `font:700 46px/1.12 ${F.ui};color:#fff;letter-spacing:-.02em`, b).innerHTML = arr.slice(1).join('<br>'); return b; };
    const L = blk('left', o.left), R = blk('right', o.right);
    const bar = el('div', `position:absolute;left:90px;top:1330px;width:170px;height:120px;background:#fff;border-radius:2px`, I);
    el('div', 'position:absolute;left:12px;right:12px;top:10px;height:70px;background:repeating-linear-gradient(90deg,#111 0 3px,#fff 3px 5px,#111 5px 6px,#fff 6px 9px,#111 9px 13px,#fff 13px 15px)', bar);
    el('div', `position:absolute;left:0;right:0;bottom:8px;text-align:center;font:500 13px ${F.mono};color:#111`, bar, 'NO. 01 OCT 2026');
    const seal = el('div', `position:absolute;left:745px;top:1275px;width:190px;height:190px;border-radius:50%;background:${P.gold};text-align:center;color:#163227`, I);
    el('div', `position:absolute;left:0;right:0;top:34px;font:500 17px ${F.mono};letter-spacing:.2em`, seal, o.seal[0]); el('div', `position:absolute;left:0;right:0;top:56px;font:italic 400 66px/1 ${F.disp}`, seal, o.seal[1]);
    el('div', `position:absolute;left:0;right:0;top:132px;font:500 17px ${F.mono};letter-spacing:.2em`, seal, o.seal[2]);
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.1; U.style.display = I.style.display = on ? 'block' : 'none'; if (!on) return;
      const a = t - o.t0, x = K.sp(t, o.t1 - 0.05, K.P.OUT), z = 1 + 0.12 * x, fo = 1 - K.clamp(x * 1.2);
      U.style.opacity = I.style.opacity = fo; const tf = `scale(${z})`; U.style.transformOrigin = I.style.transformOrigin = '540px 860px'; U.style.transform = I.style.transform = tf;
      const fe = K.clamp(a / 0.25); frame.style.clipPath = `polygon(0 0,${fe * 100}% 0,${fe * 100}% ${Math.min(100, fe * 220)}%,0 ${Math.min(100, fe * 220)}%)`; if (fe >= 1) frame.style.clipPath = 'none';
      letters.forEach((l, i) => { const e = K.sp(t, o.t0 + 0.06 + i * 0.045, K.P.HEAVY); l.style.opacity = K.clamp(e * 2); l.style.transform = `translateX(${(1 - e) * -90}px)`; });
      top.style.opacity = K.clamp((a - 0.35) / 0.2);
      const up = (e, k) => { const s = K.sp(t, o.t0 + k, K.P.BOX); e.style.opacity = K.clamp(s * 1.6); e.style.transform = `translateY(${(1 - s) * 40}px)`; };
      up(L, 0.65); up(R, 0.85); up(bar, 0.45); const ss = K.sp(t, o.t0 + 1.15, [260, 15]); seal.style.opacity = K.clamp(ss * 3); seal.style.transform = `scale(${1.5 - 0.5 * ss}) rotate(${(1 - ss) * -14}deg)`; } }; },
});
