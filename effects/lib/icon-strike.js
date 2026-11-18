// icon-strike: tool icons pop in beside the head, a red marker line is drawn across each as it is named, then both tumble out and an italic "nothing." drops in.
// Trigger: the tool names ("No Blender, no After Effects, nothing."). Source: justyn.ai DfbHxfMNsOr FEATURES F3 (CapCut / Edits icons, strike #D6323B ~11 px, dims when struck).
// opts: {icons:[{label, x, y, kind:'orange'|'ae'|'cap', t0, tStrike, dir:1|-1}], tExit, tEnd, word:{text,t0,y}}  (icons are generic stand-ins, no brand art)
K.register('icon-strike', {
  needs: [], doc: 'two app icons pop in, a red marker strike is drawn across each, they tumble out; italic "nothing." drops in',
  create(stage, o) {
    const { P, F, el } = K.kit, S = 190, host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const art = { orange: '<div style="position:absolute;inset:0;border-radius:44px;background:linear-gradient(145deg,#F5792A,#E35B0C)"></div><div style="position:absolute;left:50px;top:52px;width:90px;height:90px;border:16px solid #fff;border-radius:50%;box-sizing:border-box"></div><div style="position:absolute;left:100px;top:84px;width:36px;height:36px;border-radius:50%;background:#fff"></div>',
      ae: `<div style="position:absolute;inset:0;border-radius:44px;background:#0B0B4F;border:3px solid #3a3a99;box-sizing:border-box"></div><div style="position:absolute;inset:0;text-align:center;font:700 84px/${S}px ${F.ui};color:#9999FF;letter-spacing:-4px">Ae</div>`,
      cap: '<div style="position:absolute;inset:0;border-radius:44px;background:#F4F4F4"></div>' };
    const icons = o.icons.map(c => { const box = el('div', `position:absolute;left:${c.x - S / 2}px;top:${c.y - S / 2}px;width:${S}px;height:${S}px;will-change:transform`, host);
      const face = el('div', 'position:absolute;inset:0', box); face.innerHTML = art[c.kind || 'orange'];
      el('div', `position:absolute;left:-40px;right:-40px;top:${S + 14}px;text-align:center;font:600 26px ${F.ui};color:#fff;letter-spacing:-.01em`, box, c.label);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', S + 60); svg.setAttribute('height', S + 60); svg.style.cssText = 'position:absolute;left:-30px;top:-30px;overflow:visible';
      const d = c.dir || 1, pth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pth.setAttribute('d', d > 0 ? `M 18 52 Q ${(S + 60) / 2} ${(S + 60) / 2 + 14} ${S + 44} ${S + 8}` : `M ${S + 40} 52 Q ${(S + 60) / 2} ${(S + 60) / 2 + 10} 22 ${S + 6}`);
      pth.setAttribute('stroke', P.red); pth.setAttribute('stroke-width', 20); pth.setAttribute('stroke-linecap', 'round'); pth.setAttribute('fill', 'none'); svg.appendChild(pth); box.appendChild(svg);
      return { c, box, face, pth, len: pth.getTotalLength() }; });
    const w = el('div', `position:absolute;left:0;width:1080px;text-align:center;top:${o.word.y}px;font:italic 400 150px/1 ${F.disp};color:${P.cream};white-space:nowrap`, host, o.word.text);
    return { seek(t) {
      const live = t >= o.icons[0].t0 - 0.05 && t < o.tEnd; host.style.display = live ? 'block' : 'none'; if (!live) return;
      icons.forEach((q, i) => { const c = q.c, e = K.sp(t, c.t0, K.P.UI), sk = K.clamp((t - c.tStrike) / 0.17), fall = Math.max(0, t - (o.tExit + i * 0.06));
        const dim = K.clamp((t - c.tStrike) / 0.2), g = 5200 * fall * fall, rot = (i ? 1 : -1) * 70 * fall * fall * 3;
        q.box.style.opacity = K.clamp(e * 1.6) * (1 - K.clamp((fall - 0.25) / 0.2)); q.box.style.transform = `translate(${(i ? 1 : -1) * fall * 120}px,${(1 - Math.min(1, e)) * -30 + g * 0.1}px) scale(${0.55 + 0.45 * e}) rotate(${rot}deg)`;
        q.face.style.filter = `brightness(${1 - 0.16 * dim})`; q.pth.setAttribute('stroke-dasharray', q.len); q.pth.setAttribute('stroke-dashoffset', q.len * (1 - sk * sk * (3 - 2 * sk))); q.pth.style.opacity = sk > 0 ? 1 : 0; });
      const we = K.sp(t, o.word.t0, [420, 34]), wo = K.sp(t, o.tEnd - 0.05, [520, 40]);
      w.style.opacity = K.clamp(we * 1.5) * (1 - wo); w.style.transform = `translateY(${(1 - we) * -150}px)`; } }; },
});
