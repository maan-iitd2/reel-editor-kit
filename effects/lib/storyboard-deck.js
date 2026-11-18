// effects/lib/storyboard-deck.js
// doc: five paper "storyboard" cards (stills of the other effects: newspaper, code body, title card, word stamp, layer explode) are dealt
//   from the bottom-left, flipping in edge-on, fan into an even row, hold, then drop out. Trigger: "storyboard deck".
//   Source: reel DfnvcS1OdZi 6.90-8.27 s (E07). Row y 1163-1463 (card 1 is larger, x 35-224). Static thumbnails; the footage-based ones are live.
K.register('storyboard-deck', {
  needs: ['full'],
  doc: 'five storyboard cards dealt in a row at the bottom, then dropped',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 6.90, gap: 0.055, out: 8.20, gone: 8.27 }, opts);
    const spec = [{ x: 35, y: 1090, w: 190, h: 368 }, { x: 232, y: 1163, w: 149, h: 300 }, { x: 419, y: 1163, w: 149, h: 300 }, { x: 601, y: 1163, w: 149, h: 300 }, { x: 786, y: 1163, w: 149, h: 300 }];
    const cards = spec.map((s, i) => { const c = SK.el('div', `left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;background:#F3F1E6;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.5);overflow:hidden;transform-origin:50% 100%`, L);
      const img = SK.el('div', `left:6px;top:6px;width:${s.w - 12}px;height:${s.h - 44}px;overflow:hidden;background:#183727`, c);
      SK.el('div', `left:0;bottom:0;width:${s.w}px;height:30px;background:#183727;color:#C7B77E;font:500 11px/30px ${F.mono};text-indent:10px;letter-spacing:.08em`, c, ['0:24 PRESS', '0:08 CODE', '0:03 TITLE', '0:01 STAMP', '0:00 LAYER'][i]);
      let cv = null; const W = s.w - 12, H = s.h - 44;
      if (i === 0) { img.style.background = '#EFE8D6'; SK.el('div', `left:0;top:6px;width:${W}px;text-align:center;font:400 22px/24px ${F.news};color:#1c1a16`, img, 'The Daily Reel'); SK.el('div', `left:8px;top:34px;width:${W - 16}px;text-align:center;font:700 20px/22px ${F.news};color:#1c1a16`, img, '20 VIDEO EFFECTS');
        cv = SK.el('canvas', `left:30px;top:70px;width:${W - 60}px;height:${H - 150}px;filter:grayscale(1) contrast(1.4)`, img); cv.width = 100; cv.height = 150; SK.el('div', `left:8px;bottom:8px;width:${W - 16}px;height:56px;background:repeating-linear-gradient(#1c1a16 0 2px,transparent 2px 7px);opacity:.4`, img); }
      if (i === 1) { img.style.background = '#0C1C14'; const b = SK.el('div', `left:20px;top:40px;width:${W - 40}px;height:${H - 60}px;background:repeating-linear-gradient(90deg,#7A2E3A 0 3px,#4a1c24 3px 6px);border-radius:40px 40px 6px 6px`, img); SK.el('div', `left:${W / 2 - 22}px;top:20px;width:44px;height:44px;border-radius:50%;background:repeating-linear-gradient(90deg,#F0EEDA 0 2px,#9a9a82 2px 4px)`, img); }
      if (i === 2) { img.style.background = '#F0ECE0'; SK.el('div', `left:0;top:${H / 2 - 40}px;width:${W}px;text-align:center;font:400 38px/40px ${F.serif};color:#17311E`, img, 'TITLE<br>CARD'); }
      if (i === 3) { cv = SK.el('canvas', `left:0;top:0;width:${W}px;height:${H}px`, img); cv.width = 90; cv.height = 190; SK.el('div', `left:0;top:20px;width:${W}px;text-align:center;font:400 40px/44px ${F.serif};color:#F4F2E8;mix-blend-mode:difference`, img, 'STAMP'); }
      if (i === 4) { SK.el('div', `left:0;top:8px;width:${W}px;text-align:center;font:400 30px/30px ${F.serif};color:#fff`, img, 'layer<br>explode'); [0, 1, 2, 3].forEach(k => SK.el('div', `left:${12 + k * 9}px;top:${70 + k * 5}px;width:${W - 36}px;height:${H - 100}px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.04)`, img)); cv = SK.el('canvas', `left:30px;top:90px;width:${W - 60}px;height:${H - 150}px`, img); cv.width = 70; cv.height = 130; }
      return { c, cv }; });
    return { seek(t) {
      const live = t >= o.t0 && t < o.gone; cards.forEach(k => k.c.style.display = live ? 'block' : 'none'); if (!live) return;
      cards.forEach((k, i) => { const a = o.t0 + i * o.gap, kk = K.step(t - a, 200, 20), ex = SK.sm((t - o.out) / (o.gone - o.out));
        const rot = (1 - K.clamp(kk, 0, 1.04)) * 80, dy = (1 - K.clamp(kk, 0, 1.06)) * 420 + ex * 600, dx = (1 - K.clamp(kk, 0, 1.06)) * -140;
        k.c.style.opacity = t < a ? 0 : K.clamp(kk * 3) * (1 - ex * .3); k.c.style.transform = `translate(${dx}px,${dy}px) perspective(700px) rotateY(${rot}deg) rotate(${(1 - K.clamp(kk, 0, 1)) * -5 + Math.sin(t * 2 + i) * .6}deg)`;
        if (k.cv && t >= a) opts.foot.paint(k.cv.getContext('2d'), k.cv.width, k.cv.height); });
    } };
  },
});
