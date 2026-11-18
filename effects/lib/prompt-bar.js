// prompt-bar: cream "TO CLAUDE" prompt bar at the top; grows in from a pill, types the request, the round send button presses, label flips to DONE (text becomes
// italic "edited" with a check) or SENT (spinner), then it collapses out. Typing speed per bar (cps) or synced to the spoken words via typeFrom/typeTo.
// Trigger: any quoted instruction ("make it more aesthetic", "make it moody", "One sentence and the whole video is edited").
// Source: justyn.ai DfbHxfMNsOr FEATURES F4a-c (box 638x98 of 1276, cream #F1E8DC, send circle #173027, gold dot).
// opts: {y:250, bars:[{t0,t1,text,typeFrom,typeTo,sendAt,mode:'done'|'sent',doneText:'edited'}]}
K.register('prompt-bar', {
  needs: [], doc: 'cream TO CLAUDE prompt bar: grow-in, typewriter, send press, DONE/SENT state, collapse',
  create(stage, o) {
    const { P, F, el } = K.kit, W = 870, H = 130, x0 = 70, y0 = o.y || 250, cv = document.createElement('canvas').getContext('2d');
    const host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const bars = o.bars.map(b => { const box = el('div', `position:absolute;left:${x0}px;top:${y0}px;width:${W}px;height:${H}px;border-radius:34px;background:${P.cream};box-shadow:0 14px 40px rgba(0,0,0,.35);display:none;overflow:hidden`, host);
      const lab = el('div', `position:absolute;left:44px;top:20px;font:500 17px ${F.mono};letter-spacing:.2em;color:#8c8678`, box);
      const txt = el('div', `position:absolute;left:44px;right:150px;top:52px;white-space:nowrap;overflow:hidden;font:500 43px/60px ${F.ui};color:#1d1d1b;letter-spacing:-.01em`, box);
      const btn = el('div', `position:absolute;right:30px;top:29px;width:72px;height:72px;border-radius:50%;background:#173027;text-align:center;color:#fff;font:600 40px/70px ${F.ui}`, box);
      const bar = el('div', `position:absolute;left:0;bottom:0;height:4px;background:#173027;width:0`, box);
      return { b, box, lab, txt, btn, bar }; });
    const tail = (s, w) => { cv.font = `500 43px ${F.ui}`; let i = 0; while (i < s.length && cv.measureText(s.slice(i)).width > w) i++; return s.slice(i); };
    return { seek(t) {
      bars.forEach(q => { const b = q.b, box = q.box, a = t >= b.t0 - 0.01 && t < b.t1 + 0.2; box.style.display = a ? 'block' : 'none'; if (!a) return;
        const e = K.sp(t, b.t0, K.P.UI), x = K.sp(t, b.t1 - 0.05, K.P.OUT), sent = t >= b.sendAt;
        const n = b.typeTo > b.typeFrom ? Math.floor(K.clamp((t - b.typeFrom) / (b.typeTo - b.typeFrom)) * b.text.length) : Math.floor(Math.max(0, t - b.typeFrom) * (b.cps || 40));
        const shown = b.text.slice(0, Math.min(n, b.text.length)), caret = !sent && Math.floor(t * 2.2) % 2 === 0 ? '|' : '';
        box.style.opacity = K.clamp(e * 1.5) * (1 - K.clamp(x)); box.style.transform = `translateY(${(1 - e) * -40 + x * -30}px) scale(${0.55 + 0.45 * e},${0.7 + 0.3 * e + (-0.2) * x})`; box.style.transformOrigin = '50% 0';
        q.lab.innerHTML = sent ? `<span style="color:${P.gold}">●</span> ${b.mode === 'done' ? 'DONE' : 'SENT'}` : 'TO CLAUDE';
        if (sent && b.mode === 'done') { q.txt.style.cssText += `;font:italic 400 58px/60px ${F.disp};color:#1d1d1b;top:46px`; q.txt.textContent = b.doneText; }
        else { q.txt.style.font = `500 43px/60px ${F.ui}`; q.txt.style.top = '52px'; q.txt.style.color = sent ? '#9a968c' : '#1d1d1b'; q.txt.textContent = tail(shown, 650) + caret; }
        const press = sent ? K.clamp((t - b.sendAt) / 0.12) : 0; q.btn.style.transform = `scale(${1 - 0.14 * Math.sin(press * Math.PI)})`;
        q.btn.textContent = !sent ? '↑' : b.mode === 'done' ? '✓' : ''; q.btn.style.border = sent && b.mode === 'sent' ? '5px solid rgba(255,255,255,.3)' : 'none';
        q.btn.style.borderTopColor = sent && b.mode === 'sent' ? '#fff' : ''; q.btn.style.boxSizing = 'border-box';
        if (sent && b.mode === 'sent') q.btn.style.transform += ` rotate(${(t - b.sendAt) * 900}deg)`;
        q.bar.style.width = (sent ? K.clamp((t - b.sendAt) / Math.max(0.2, b.t1 - b.sendAt)) * W : 0) + 'px'; }); } }; },
});
