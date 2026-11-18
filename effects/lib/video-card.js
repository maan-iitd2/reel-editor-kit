// video-card: a green walkthrough video card grows out of a small icon (thumbnail with play button, gold progress dot, title, chapter label that steps 01-04), then collapses
// sideways (a white bar grows from its left edge) so the comment box can take its place. Trigger: "I recorded a video walking you through exactly how I do this".
// Source: justyn.ai DfbHxfMNsOr FEATURES F22 (card 458x339 of 1276, chapters The raw take / Read the storyboard / Leave notes / The finished reel).
// opts: {t0,t1,title,sub,chapters:[{t,name}], thumbs:{room,shark}, x:60,y:250,w:640, layer}
K.register('video-card', {
  needs: [], doc: 'walkthrough video card: grows from an icon, chapter thumbnails step, progress dot, collapses into a white bar',
  create(stage, o) {
    const { P, F, el } = K.kit, X = o.x || 60, Y = o.y || 250, W = o.w || 640, TH = Math.round(W * 9 / 16), H = TH + 128, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const card = el('div', `position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:${H}px;border-radius:18px;background:#1D382B;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5);transform-origin:0 0`, host);
    const pic = el('div', `position:absolute;left:0;top:0;width:${W}px;height:${TH}px;background:#0b0f0d;overflow:hidden`, card);
    const scenes = [0, 1, 2, 3].map(i => el('div', 'position:absolute;inset:0;display:none', pic));
    scenes[0].style.background = `#111 url(${o.thumbs.room}) 50% 22%/${W}px auto`; el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 22%/${W}px auto`, scenes[0]);
    scenes[1].style.background = '#0d1a14'; for (let i = 0; i < 9; i++) el('div', `position:absolute;left:${30 + (i % 3) * 190}px;top:${24 + Math.floor(i / 3) * 90}px;width:170px;height:76px;border-radius:6px;background:${i === 4 ? '#e8dfce' : '#1f3a2b'}`, scenes[1]);
    scenes[2].style.background = '#0d1a14'; [[40, 300], [170, 380], [60, 250]].forEach(([l, w], i) => el('div', `position:absolute;left:${l}px;top:${28 + i * 82}px;width:${w}px;height:58px;border-radius:12px;background:${i === 1 ? '#C7A259' : '#2c4a3b'}`, scenes[2]));
    scenes[3].style.background = `#111 url(${o.thumbs.room}) 50% 22%/${W}px auto`; el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 18%/${W * 1.2}px auto`, scenes[3]);
    const play = el('div', `position:absolute;left:${W / 2 - 38}px;top:${TH / 2 - 38}px;width:76px;height:76px;border-radius:50%;background:rgba(255,255,255,.92);text-align:center;font:400 34px/76px ${F.ui};color:#111`, card, '▶');
    const pb = el('div', `position:absolute;left:0;top:${TH - 10}px;width:${W}px;height:6px;background:rgba(255,255,255,.2)`, card), pf = el('div', `position:absolute;left:0;top:0;height:6px;background:${P.gold}`, pb);
    el('div', `position:absolute;left:26px;top:${TH + 20}px;font:600 38px ${F.ui};color:${P.cream};letter-spacing:-.01em`, card, o.title);
    const sub = el('div', `position:absolute;left:26px;top:${TH + 78}px;font:500 20px ${F.mono};letter-spacing:.1em;color:${P.gold}`, card);
    const bar = el('div', `position:absolute;left:0;top:0;height:${H}px;width:0;background:#FBFBFB`, card);
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.05; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, [300, 24]), x = K.clamp((t - (o.t1 - 0.14)) / 0.14), p = K.clamp((t - o.t0) / (o.t1 - o.t0));
      card.style.opacity = K.clamp(e * 2); card.style.transform = `translate(${x * -40}px,0) scale(${(0.12 + 0.88 * Math.min(1.04, e)) * (1 - 0.0 * x)},${(0.12 + 0.88 * Math.min(1.04, e)) * (1 - x * 0.6)})`; card.style.transformOrigin = '0 0';
      let ci = 0; o.chapters.forEach((c, i) => { if (t >= c.t) ci = i; }); scenes.forEach((s, i) => s.style.display = i === ci ? 'block' : 'none');
      sub.textContent = t < o.chapters[0].t ? o.sub : String(ci + 1).padStart(2, '0') + '  ' + o.chapters[ci].name; pf.style.width = (p * W) + 'px'; play.style.opacity = ci === 0 ? 1 : 0.0;
      bar.style.width = (x * W) + 'px'; } }; },
});
