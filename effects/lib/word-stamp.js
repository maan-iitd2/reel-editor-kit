// effects/lib/word-stamp.js
// doc: a gold italic script label ("word") and a tall condensed serif word that stamps in letter by letter BEHIND the head
//   (type layer between room and person matte), holds, then fades. Letters crossing bright wall areas flip dark (blend: difference).
//   Trigger: the word's own spoken name ("word stamp"; letters land during the second word). Needs the person matte.
//   Source: reel DfnvcS1OdZi 1.10-2.07 s (E02). Word x 80-705, cap height ~195 px, y 420-615. Cream #F4F2E8, gold #BFAB6D.
K.register('word-stamp', {
  needs: ['subject'],
  doc: 'script label + serif letters stamp in one by one behind the head',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'behind'), F = SK.FONT;
    const o = Object.assign({ label: 1.10, t0: 1.47, gap: 0.0667, out: 2.00, gone: 2.07, word: 'STAMP', script: 'word', x: 80, y: 392 }, opts);
    const root = SK.el('div', `left:${o.x}px;top:${o.y}px;width:700px;height:300px`, L);
    const sc = SK.el('div', `left:5px;top:-48px;font:italic 400 76px/80px ${F.serif};color:#BFAB6D`, root, o.script);
    const mk = (col, par) => { const w = SK.el('div', 'left:0;top:0;white-space:nowrap', par);
      return { w, sp: [...o.word].map(ch => SK.el('span', `position:relative;display:inline-block;font:400 285px/260px ${F.serif};color:${col};transform-origin:50% 60%;width:${ch === 'M' ? 150 : ch === 'S' ? 104 : ch === 'T' ? 112 : ch === 'A' ? 124 : 108}px;text-align:center`, w, `<span style="display:inline-block;transform:scaleX(.74)">${ch}</span>`)) }; };
    const A = mk('#F4F2E8', root);
    // where a letter crosses the bright picture mat on the wall it reads dark green (as in the source): a second, clipped, dark copy
    const clipR = SK.el('div', `left:${352 - o.x}px;top:${292 - o.y}px;width:330px;height:510px;overflow:hidden`, root), inner = SK.el('div', `left:${o.x - 352}px;top:${o.y - 292}px;width:700px;height:300px`, clipR);
    const B = mk('#183727', inner), sp = A.sp.concat(B.sp);
    return { seek(t) {
      const live = t >= o.label && t < o.gone; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const fade = 1 - SK.ramp(t, o.out, o.gone), lk = K.sp(t, o.label, K.P.UI), dr = Math.sin(t * 2.2) * 2;
      sc.style.opacity = K.clamp(lk) * fade; sc.style.transform = `translateY(${(1 - K.clamp(lk, 0, 1.05)) * 16 + dr}px)`;
      sp.forEach((e, i) => { const a = o.t0 + i * o.gap, k = K.step(t - a, 360, 20); e.style.opacity = t < a ? 0 : K.clamp(k * 1.6) * fade;
        e.style.transform = `translateY(${dr * (i % 2 ? -1 : 1) * .6}px) scale(${1 + .18 * (1 - K.clamp(k, 0, 1.12))})`; });
    } };
  },
});
