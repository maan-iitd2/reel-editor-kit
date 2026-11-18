// effects/lib/layer-explode.js
// doc: the opening move. The frame is a stack of five glass planes in 3D (ROOM / TYPE / ME / LIST / SOUND, labelled, white keylines)
//   on a dark green-black base; the room plane is the clean plate, ME the person matte, LIST the FX dashboard, SOUND a waveform.
//   The planes spread, rotate flat, scale up and collapse into the normal composited frame (type slides off, waveform leaves).
//   Trigger: "layer explode" (collapse starts near the end of "explode"). Needs the clean plate + person matte (+ opts.list = the
//   dashboard wrapper element, which is borrowed into the LIST plane until the end; opts.envAt(t) = 0..1 voice level for the waveform).
//   Source: reel DfnvcS1OdZi 0.00-0.93 s (E01): hold 0-0.55, spread + collapse 0.55-0.93. Base #0C1414.
K.register('layer-explode', {
  needs: ['clean', 'subject'],
  doc: '3D stack of room/type/person/list/sound planes that collapses into the frame',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 0, spread: 0.55, end: 0.93, word: ['layer', 'explode'], envAt: () => 0 }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;background:#0C1414;perspective:2600px;perspective-origin:540px 900px;overflow:hidden', L);
    const stk = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;transform-style:preserve-3d', root);
    const names = ['ROOM', 'TYPE', 'ME', 'LIST', 'SOUND'], zs = [-420, -210, 0, 210, 420];
    const planes = names.map((n, i) => { const p = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;transform-style:preserve-3d;box-sizing:border-box;border:3px solid rgba(255,255,255,.5)', stk);
      const lb = SK.el('div', `left:${4 + i * 8}px;top:-56px;font:500 34px/40px ${F.mono};letter-spacing:.06em;color:#F7FCF6`, p, n); return { p, lb }; });
    const rc = SK.el('canvas', 'left:-3px;top:-3px;width:1080px;height:1920px', planes[0].p); rc.width = 540; rc.height = 960;
    const room = rc.getContext('2d'); room.drawImage(opts.room.base, 0, 0, 540, 960);
    const type = SK.el('div', `left:0;top:0;width:1080px;height:1920px`, planes[1].p);
    const tl = [0, 1].map(i => SK.el('div', `left:${70 + i * 6}px;top:${300 + i * 215}px;font:400 214px/220px ${F.serif};color:#fff;white-space:nowrap;transform-origin:0 50%`, type, `<span style="display:inline-block;transform:scaleX(.9);transform-origin:0 50%">${o.word[i]}</span>`));
    const mc = SK.el('canvas', 'left:-3px;top:-3px;width:1080px;height:1920px', planes[2].p); mc.width = 540; mc.height = 960; const me = mc.getContext('2d');
    const wv = SK.el('canvas', 'left:300px;top:1410px;width:660px;height:220px', planes[4].p); wv.width = 330; wv.height = 110; const wg = wv.getContext('2d');
    let parent0 = null;
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; root.style.display = live ? 'block' : 'none';
      const list = opts.list; if (list) { const want = live ? planes[3].p : (opts.L && opts.L.top) || stage; if (list.parentNode !== want) want.appendChild(list); }
      if (!live) return; SK.frame.shark.alpha = 0;
      const c = K.clamp(K.step(t - o.spread, 140, 21), 0, 1), sp = 1 + .55 * SK.sm((t - (o.spread - .05)) / .12) * (1 - c);
      const sway = 1 - c, S = .74 + .26 * c;
      const ry = (21 + Math.sin(t * 3) * 1.6) * sway, rx = (-5 + Math.cos(t * 2.4)) * sway;
      stk.style.transform = `translate(${(-70 + Math.sin(t * 2) * 4) * sway}px,${40 * sway}px) scale(${S}) rotateX(${rx}deg) rotateY(${ry}deg)`;
      planes.forEach((pl, i) => { pl.p.style.transform = `translateZ(${zs[i] * (1 - c) * sp}px)`; pl.p.style.borderColor = `rgba(255,255,255,${.5 * (1 - SK.sm((t - .72) / .2))})`; pl.lb.style.opacity = 1 - SK.sm((t - .56) / .08); });
      planes[0].p.style.opacity = 1; planes[1].p.style.opacity = 1 - SK.sm((t - .66) / .1); planes[4].p.style.opacity = 1 - SK.sm((t - .66) / .1);
      tl.forEach((e, i) => { e.style.transform = `translateY(${-130 * SK.sm((t - .62) / .14)}px)`; e.style.filter = `blur(${8 * SK.sm((t - .66) / .1)}px)`; });
      root.style.background = `rgba(12,20,20,${1 - SK.sm((t - .8) / .12)})`;
      me.clearRect(0, 0, 540, 960); me.save(); me.filter = 'brightness(.82) contrast(1.05) sepia(.1)'; me.drawImage(opts.sharkEl, 0, 0, 540, 960); me.restore();
      wg.clearRect(0, 0, 330, 110); for (let i = 0; i < 64; i++) { const v = opts.envAt(t + (i - 20) / 14), h = 4 + v * 100 * (.5 + .5 * Math.abs(Math.sin(i * 1.7))); wg.fillStyle = i < 20 ? '#F3FEF4' : '#C8707A'; wg.fillRect(i * 5.1, 55 - h / 2, 3.2, h); }
      wg.fillStyle = '#fff'; wg.fillRect(20 * 5.1 - 1, 0, 2, 110);
    } };
  },
});
