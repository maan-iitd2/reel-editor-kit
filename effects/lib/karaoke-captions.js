// karaoke-captions: 2-4 word caption chunks on a dark-green box, spoken words cream, upcoming words muted; chunk swaps on a hard cut.
// Trigger: every word (word timings from the SCRIPT text, not the audio). Options: hide [[t0,t1]], noBox [[t0,t1]] (bare text, grid scene),
// scale [{t0,t1,s}] (the "captions come in huge" pulse). Source: justyn.ai DfbHxfMNsOr, FEATURES S1 + F14 (box 52px of 718 = v 0.85; here lifted
// to y 1470 so the box clears the IG bottom zone, 420 px).
K.register('karaoke-captions', {
  needs: [], doc: 'karaoke captions in a green box at chest height; spoken cream, upcoming muted; optional big pulse and bare-text mode',
  create(stage, o) {
    const { P, F, el } = K.kit, words = o.words, cy = o.y || 1470, fs = o.size || 62;
    const host = el('div', `position:absolute;left:0;top:${cy}px;width:1080px;height:0`, o.layer || stage);
    // chunk: greedy up to 4 words, break after punctuation, never leave a 1-word chunk mid-sentence
    const chunks = []; let cur = [];
    words.forEach((w, i) => { cur.push(i); const end = /[.,?!]$/.test(w.w);
      if (cur.length >= 4 || (end && cur.length >= 2) || (end && /[.?!]$/.test(w.w))) { chunks.push(cur); cur = []; } });
    if (cur.length) chunks.push(cur);
    const boxes = chunks.map(c => { const b = el('div', `position:absolute;left:540px;top:0;transform:translate(-50%,-50%);white-space:nowrap;display:none;padding:6px 24px 8px;font:400 ${fs}px/1.1 ${F.disp};letter-spacing:-.005em`, host);
      const sp = c.map((wi, k) => el('span', '', b, (k ? ' ' : '') + words[wi].w)); return { b, sp, c }; });
    const t0s = chunks.map(c => words[c[0]].t0 - 0.02), t1s = chunks.map((c, i) => i + 1 < chunks.length ? words[chunks[i + 1][0]].t0 - 0.02 : words[c[c.length - 1]].t1 + 0.5);
    const inR = (t, a) => (a || []).some(r => t >= r[0] && t < r[1]);
    let last = -1;
    return { seek(t) {
      let a = -1; for (let i = 0; i < chunks.length; i++) if (t >= t0s[i] && t < Math.min(t1s[i], t0s[i] + 4)) { a = i; break; }
      if (a !== last) { if (last >= 0) boxes[last].b.style.display = 'none'; last = a; }
      if (a < 0 || inR(t, o.hide)) { if (a >= 0) boxes[a].b.style.display = 'none'; else if (last >= 0) boxes[last].b.style.display = 'none'; return; }
      const { b, sp, c } = boxes[a]; b.style.display = 'block'; const bare = inR(t, o.noBox);
      b.style.background = bare ? 'transparent' : P.cap; b.style.padding = bare ? '0' : '6px 24px 8px';
      c.forEach((wi, k) => sp[k].style.color = t >= words[wi].t0 - 0.03 ? P.cream : P.muted);
      let s = 1; (o.scale || []).forEach(q => { s = K.lerp(s, q.s, K.vis(t, q.t0, q.t1, K.P.UI, K.P.UI) ); });
      b.style.transform = `translate(-50%,-50%) scale(${s})`; } }; },
});
