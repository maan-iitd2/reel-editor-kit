// raw-footage-player: a player window grows out of the file thumbnail, plays a wide, cooler-graded "raw take" (frames from the shark plates), shows a gold 1.5x chip,
// a scrub bar with timecode and waveform where pink "cut" regions grow, and a white pill "1:07 of raw footage"; DEAD AIR / CUT stamps (bad-take-stamp) slam in on "bad takes".
// Trigger: "still with the bad takes in it". Source: justyn.ai DfbHxfMNsOr FEATURES F10 (player 638x358 of 1276, pill 267x47, stamps).
// opts: {t0,t1,tDead,tCut, y:330, take:{room, shark:(i)=>url, from: frame offset}, pill:['1:07',' of raw footage'], layer}
K.register('raw-footage-player', {
  needs: ['subject', 'clean'], doc: 'raw-take player window with scrub bar, 1.5x chip, DEAD AIR/CUT stamps, "1:07 of raw footage" pill',
  create(stage, o) {
    const { P, F, el } = K.kit, X = 110, Y = o.y || 330, W = 860, H = 484, rnd = K.mulberry32(11), host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const win = el('div', `position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:${H}px;border-radius:14px;border:3px solid #fff;box-sizing:border-box;overflow:hidden;background:#0a0a0a;box-shadow:0 30px 80px rgba(0,0,0,.55)`, host);
    const pic = el('div', `position:absolute;inset:0;filter:saturate(.7) brightness(.85) contrast(1.05)`, win);
    const rimg = el('img', `position:absolute;left:0;top:-300px;width:${W}px;height:${W * 16 / 9}px;transform-origin:50% 40%`, pic); rimg.src = o.take.room;
    const simg = el('img', `position:absolute;left:0;top:-300px;width:${W}px;height:${W * 16 / 9}px;transform-origin:50% 40%`, pic);
    el('div', `position:absolute;right:16px;top:14px;font:500 24px ${F.mono};color:${P.gold}`, win, '▶▶ 1.5×');
    const bar = el('div', `position:absolute;left:${X}px;top:${Y + H + 10}px;width:${W}px;height:78px;background:rgba(10,12,11,.82);border-radius:10px`, host);
    const tc = el('div', `position:absolute;left:16px;top:24px;font:500 26px ${F.mono};color:rgba(255,255,255,.7)`, bar);
    const wv = el('div', `position:absolute;left:230px;right:16px;top:14px;height:50px`, bar), bars = [];
    for (let i = 0; i < 80; i++) { const h = 8 + rnd() * 34; bars.push(el('div', `position:absolute;left:${i * 7.9}px;top:${25 - h / 2}px;width:4px;height:${h}px;border-radius:2px;background:#8c8f8a`, wv)); }
    const play = el('div', `position:absolute;top:8px;width:4px;height:62px;background:${P.tpink}`, wv);
    const pill = el('div', `position:absolute;left:${(1080 - 640) / 2}px;top:${Y + H + 120}px;width:640px;height:96px;border-radius:24px;background:#FCF9F9;text-align:center;font:700 52px/96px ${F.ui};color:#0b0b0b;letter-spacing:-.02em;box-shadow:0 16px 40px rgba(0,0,0,.4)`, host);
    pill.innerHTML = `<span style="color:#D2606C">${o.pill[0]}</span>${o.pill[1]}`;
    const stamps = K.make('bad-take-stamp', stage, { layer: win, stamps: [{ text: 'DEAD AIR', x: W / 2, y: 100, t0: o.tDead, t1: o.t1, rot: -2, size: 66 }, { text: 'CUT', x: W / 2, y: H - 100, t0: o.tCut, t1: o.t1, rot: 2, size: 66 }] });
    let lastI = -1;
    return { async seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.1; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, [330, 28]), x = K.sp(t, o.t1 - 0.05, K.P.OUT), a = K.clamp(e * 2) * (1 - x), fr = Math.max(0, Math.floor((t - o.t0) * 30)) + (o.take.from || 0);
      if (fr !== lastI) { lastI = fr; simg.src = o.take.shark(fr); await simg.decode().catch(() => {}); }
      [win, bar, pill].forEach(q => { q.style.opacity = a; }); win.style.transform = `scale(${0.45 + 0.55 * Math.min(1.03, e)})`; win.style.transformOrigin = '50% 62%';
      bar.style.transform = `translateY(${(1 - e) * 30}px)`; pill.style.transform = `translateY(${(1 - K.sp(t, o.t0 + 0.12, K.P.UI)) * 40}px)`;
      const prog = K.clamp((t - o.t0) / (o.t1 - o.t0)); tc.textContent = `0:0${Math.min(9, Math.floor(prog * 3))} / 1:07`; play.style.left = (prog * 0.35 * 614) + 'px';
      bars.forEach((b, i) => { const cut = (t > o.tDead && i > 10 && i < 10 + (t - o.tDead) * 50) || (t > o.tCut && i > 46 && i < 46 + (t - o.tCut) * 40); b.style.background = cut ? P.tpink : '#8c8f8a'; });
      stamps.seek(t); } }; },
});
