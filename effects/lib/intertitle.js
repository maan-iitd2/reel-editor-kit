// effects/lib/intertitle.js
// doc: hard cut to near-black where the footage sits in a circle that shrinks to a dot, a green iris opens from the left to a framed
//   italic-serif "Intertitle." card (double rule frame draws on, diamonds, grain), then a circular iris opens from the lower right and
//   hands the screen back to the footage (a hole in the card, so the real footage shows through). Trigger: "intertitle".
//   Source: reel DfnvcS1OdZi 20.60-21.60 s (E17). Card is centred in the area left of the dashboard (x ~ 375). Green #1B3B2B.
K.register('intertitle', {
  needs: ['full'],
  doc: 'circle-footage to green framed intertitle card, then iris back to footage',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 20.60, shrink: 20.70, disc: 20.80, card: 20.90, back: 21.40, irisA: 21.45, end: 21.60, text: 'Intertitle.' }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', L);
    const blk = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;background:#111', root);
    const dot = SK.el('canvas', 'left:0;top:0;width:520px;height:520px;border-radius:50%', root); dot.width = 260; dot.height = 260; const dx = dot.getContext('2d');
    const grn = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;background:#1B3B2B', root);
    SK.el('div', 'left:0;top:0;width:1080px;height:1920px;opacity:.5;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1.2px);background-size:7px 7px', grn);
    const fr = SK.el('div', 'left:78px;top:327px;width:650px;height:801px', grn);
    const svg = `<svg width="650" height="801" viewBox="0 0 650 801" style="position:absolute;left:0;top:0"><rect id="r1" x="1" y="1" width="648" height="799" fill="none" stroke="#CCE0D2" stroke-opacity=".75" stroke-width="2"/><rect id="r2" x="18" y="18" width="614" height="765" fill="none" stroke="#CCE0D2" stroke-opacity=".45" stroke-width="1.5"/></svg>`;
    fr.innerHTML = svg; const r1 = fr.querySelector('#r1'), r2 = fr.querySelector('#r2'); const len1 = 2 * (648 + 799), len2 = 2 * (614 + 765);
    r1.style.strokeDasharray = len1; r2.style.strokeDasharray = len2;
    const orn = (y) => SK.el('div', `left:318px;top:${y}px;width:14px;height:14px;background:#CCE0D2;transform:rotate(45deg);opacity:.8`, fr);
    const d1 = orn(300), d2 = orn(486);
    SK.el('div', 'left:255px;top:392px;width:140px;height:1.5px;background:rgba(204,224,210,.5)', fr);
    const tx = SK.el('div', `left:0;top:310px;width:650px;text-align:center;font:italic 400 104px/150px ${F.serif};color:#E8F0E4;letter-spacing:-.01em`, fr, o.text);
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; root.style.display = live ? 'block' : 'none'; if (!live) return;
      // footage circle: 20.60 big, shrinks, gone as the disc opens
      const sk = K.step(t - o.shrink, 260, 24), rad = 260 - 190 * K.clamp(sk, 0, 1.05);
      dot.style.display = t < o.disc + .06 ? 'block' : 'none'; dot.style.width = dot.style.height = (rad * 2) + 'px'; dot.style.left = (375 - rad) + 'px'; dot.style.top = (960 - rad) + 'px'; if (t < o.disc + .06) { const c = document.createElement('canvas'); c.width = 270; c.height = 480; opts.foot.paint(c.getContext('2d'), 270, 480); dx.clearRect(0, 0, 260, 260); dx.drawImage(c, 15, 40, 240, 240, 0, 0, 260, 260); }
      const dk = SK.sm((t - o.disc) / .1), R = 1500 * dk; grn.style.clipPath = t < o.disc ? 'circle(0px at 0px 960px)' : `circle(${R}px at 0px 960px)`;
      // frame draw-on and text
      const fk = SK.sm((t - o.card) / .12); r1.style.strokeDashoffset = len1 * (1 - fk); r2.style.strokeDashoffset = len2 * (1 - SK.sm((t - o.card - .03) / .12));
      const tk = K.step(t - o.card, 260, 24); tx.style.opacity = K.clamp(tk * 1.4); tx.style.transform = `translateY(${(1 - K.clamp(tk, 0, 1.05)) * 20}px) scale(${.96 + .04 * K.clamp(tk, 0, 1.05)})`;
      d1.style.opacity = d2.style.opacity = fk * .8; const dr = Math.sin(t * 1.3) * 2; tx.style.marginLeft = dr + 'px';
      // iris back to footage: a hole opens in everything from the lower right
      const ik = SK.ease((t - o.irisA) / (o.end - o.irisA)); const hole = t < o.irisA ? 0 : 2300 * ik * ik + 60 * SK.sm((t - o.back) / .05);
      const mask = hole > 0 ? `radial-gradient(circle at 700px 1050px, transparent ${hole}px, #000 ${hole + 1.5}px)` : 'none';
      root.style.webkitMaskImage = mask; root.style.maskImage = mask;
    } };
  },
});
