// effects/lib/video-backdrop.js
// doc: the room behind the person is replaced by three videos in turn (a raw take, a storyboard document, the finished reel) with the
//   person staying in front. Trigger: "video backdrop". Pair with step-pill. Needs the person matte and an alternative-take source:
//   backdrops A and C are other moments of the same plate sequence (opts.platePattern/opts.count), graded differently.
//   Source: reel DfnvcS1OdZi 17.03-18.20 s (E14): A 17.20, doc 17.45, C 17.78, back to the room at 18.20. Uses an async prepare(t).
K.register('video-backdrop', {
  needs: ['subject'],
  doc: 'three video backdrops (raw take / storyboard doc / finished reel) behind the person',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'behind'), F = SK.FONT;
    const o = Object.assign({ a: 17.20, b: 17.45, c: 17.78, end: 18.20, pattern: opts.platePattern, count: 792, offA: -6, offC: -9 }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;overflow:hidden', L);
    const A = SK.el('canvas', 'left:0;top:0;width:1080px;height:1920px', root); A.width = 540; A.height = 960;
    const Bd = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;background:#1C3C2C', root);
    const C = SK.el('canvas', 'left:0;top:0;width:1080px;height:1920px', root); C.width = 540; C.height = 960;
    // storyboard document
    const rows = [['0:00.6', '"Hook, kinetic type behind your head: I DIDN\'T in the note, a forest field cuts in on "didn\'t" and EDIT stamps, breaking it. A SINGLE SECOND with a running timecode.'], ['0:04.4', '"No CapCut, no Edits app, nothing." The real CapCut and Edits app icons pop in on their names, each struck by a red line.'], ['0:09.8', 'The prompt bar types "make it more aesthetic. The whole thing." and the grade warms.']];
    SK.el('div', `left:60px;top:60px;font:italic 400 38px/44px ${F.serif};color:#CCE0D2`, Bd, 'I didn\'t edit a single second of this video. Claude did.');
    rows.forEach((r, i) => { const y = 200 + i * 430; SK.el('div', `left:60px;top:${y}px;width:170px;height:300px;background:#0C1C14;border:2px solid #2E4A3A;border-radius:6px`, Bd);
      SK.el('div', `left:60px;top:${y + 310}px;font:500 20px/24px ${F.mono};color:#C7B77E`, Bd, r[0]);
      SK.el('div', `left:270px;top:${y}px;width:460px;font:400 33px/42px ${F.body};color:#E8F0E4`, Bd, r[1]); SK.el('div', `left:270px;top:${y + 250}px;font:500 20px/26px ${F.mono};color:#9EAA83`, Bd, 'SOUND  soft whoosh, tick, gear click'); });
    const img = { A: new Image(), C: new Image() }, state = { A: -1, C: -1 };
    const frameOf = t => Math.min(o.count - 1, Math.max(0, Math.round(t * 30)));
    const paint = (cv, im, flt, sc, dx, dy) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 540, 960); g.save(); g.filter = flt; g.drawImage(opts.room.base, 0, 0, 540, 960); g.restore();
      g.save(); g.filter = flt; g.translate(dx, dy); g.scale(sc, sc); if (im.complete && im.naturalWidth) g.drawImage(im, 0, 0, 540, 960); g.restore(); };
    return { async prepare(t) {
      if (t < o.a || t > o.end) return;
      const fa = frameOf(t + o.offA), fc = frameOf(t + o.offC);
      if (state.A !== fa) { state.A = fa; img.A.src = o.pattern.replace('%05d', String(fa).padStart(5, '0')); await img.A.decode().catch(() => 0); }
      if (state.C !== fc) { state.C = fc; img.C.src = o.pattern.replace('%05d', String(fc).padStart(5, '0')); await img.C.decode().catch(() => 0); }
    }, seek(t) {
      const live = t >= o.a && t < o.end; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const ka = K.sp(t, o.a, K.P.UI), kb = K.sp(t, o.b, [420, 36]), kc = K.sp(t, o.c, [420, 36]);
      paint(A, img.A, 'brightness(.75) saturate(.75) hue-rotate(-14deg) blur(1.2px)', .55, 250, 20);
      { const g = A.getContext('2d'); const gr = g.createRadialGradient(95, 120, 4, 95, 120, 150); gr.addColorStop(0, 'rgba(255,214,150,.75)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 300, 330); g.fillStyle = '#E8DCC0'; g.beginPath(); g.moveTo(75, 90); g.lineTo(115, 90); g.lineTo(127, 135); g.lineTo(63, 135); g.fill(); g.fillStyle = '#2a2018'; g.fillRect(93, 135, 4, 70); }
      paint(C, img.C, 'brightness(.9) sepia(.25) contrast(1.05)', .9, 28, 40);
      root.style.opacity = K.clamp(ka * 1.6); A.style.transform = `translateY(${(1 - K.clamp(ka, 0, 1.05)) * 70}px) scale(${1 + .04 * Math.sin(t * 1.4)})`;
      Bd.style.transform = `translateY(${(1 - K.clamp(kb, 0, 1.03)) * 1920}px)`; C.style.transform = `translateY(${(1 - K.clamp(kc, 0, 1.03)) * 1920}px)`;
      Bd.style.display = t >= o.b ? 'block' : 'none'; C.style.display = t >= o.c ? 'block' : 'none';
    } };
  },
});
