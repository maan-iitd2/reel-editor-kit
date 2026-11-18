// bigger-stack: a staged type-size demo: a heavy grotesk BIGGER on a green box, gold italic "titles." on green, three small caps boxes THAT'S / ONE / MORE, then a cream
// box with black italic "sentence."; each pops in on its spoken word with a spring, all leave on a quick slice. Trigger: "bigger titles, that's one more sentence".
// Source: justyn.ai DfbHxfMNsOr FEATURES F21. opts: {t1, items:[{text,t0,kind:'big'|'ital'|'small'|'cream', x,y,w,h,size}]}
K.register('bigger-stack', {
  needs: [], doc: 'BIGGER / titles. / THAT\'S ONE MORE / sentence. word-timed box stack with spring pops',
  create(stage, o) {
    const { P, F, el } = K.kit, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const sty = { big: [P.green2, P.cream, `700 ${F.grot}`], ital: [P.green2, P.gold, `italic 400 ${F.disp}`], small: [P.green2, P.cream, `700 ${F.grot}`], cream: [P.cream, '#111', `italic 400 ${F.disp}`] };
    const it = o.items.map(q => { const s = sty[q.kind], d = el('div', `position:absolute;left:${q.x}px;top:${q.y}px;width:${q.w}px;height:${q.h}px;background:${s[0]};color:${s[1]};font:${s[2].split(' ')[0]} ${s[2].split(' ')[1] === 'Arial' ? '' : ''}`, host);
      d.style.font = (q.kind === 'big' || q.kind === 'small' ? `400 ${q.size}px/${q.h}px ${F.grot}` : `${q.kind === 'cream' ? 'italic ' : 'italic '}400 ${q.size}px/${q.h}px ${F.disp}`); d.style.textAlign = 'center'; d.style.whiteSpace = 'nowrap';
      d.style.letterSpacing = q.kind === 'big' || q.kind === 'small' ? '-0.02em' : '0'; d.textContent = q.text; return { q, d }; });
    return { seek(t) {
      const on = t >= o.items[0].t0 - 0.02 && t < o.t1 + 0.1; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const x = K.clamp((t - (o.t1 - 0.12)) / 0.12);
      it.forEach(({ q, d }) => { const e = K.sp(t, q.t0, [380, 24]); d.style.opacity = K.clamp(e * 2) * (1 - x); d.style.transform = `scale(${0.7 + 0.3 * e},${(0.7 + 0.3 * e) * (1 - x)}) translateY(${(1 - e) * 24}px)`; }); } }; },
});
