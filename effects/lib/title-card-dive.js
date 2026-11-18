// effects/lib/title-card-dive.js
// doc: hard cut to a cream title card: a running mono timecode (one count per frame), TITLE then CARD rise out of a baseline mask,
//   the footage appears inside a green phone mock-up (big, then springs small) with DIVE beneath, then the camera dives into the
//   phone until the footage fills the frame. Trigger: "title card dive". Source: reel DfnvcS1OdZi 3.33-4.50 s (E04).
//   Content sits left of the dashboard (centre x ~376). Needs opts.foot. Colours: cream #F0ECE0, ink #17311E, bezel #183727.
K.register('title-card-dive', {
  needs: ['full'],
  doc: 'cream title card with timecode, TITLE/CARD rise, footage-in-phone, DIVE zoom into the footage',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 3.3333, title: 3.40, card: 3.767, phone: 3.933, dive: 4.033, zoom: 4.367, end: 4.50, tc0: 6 * 30 + 26 }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;background:#F0ECE0', L);
    const tc = SK.el('div', `left:0;top:400px;width:752px;text-align:center;font:500 30px/40px ${F.mono};letter-spacing:.32em;color:rgba(23,49,30,.75)`, root, '');
    const word = (txt, top) => { const m = SK.el('div', `left:0;top:${top}px;width:752px;height:200px;overflow:hidden`, root); return SK.el('div', `left:0;top:0;width:752px;text-align:center;font:400 250px/200px ${F.serif};color:#17311E;transform-origin:50% 50%`, m, `<span style="display:inline-block;transform:scaleX(.72)">${txt}</span>`); };
    const wT = word('TITLE', 468), wC = word('CARD', 680);
    const rule = SK.el('div', 'left:330px;top:905px;width:92px;height:3px;background:#BEA85D', root);
    const ph = SK.el('div', 'left:148px;top:219px;width:466px;height:781px;transform-origin:50% 50%', root);
    const bez = SK.el('div', 'left:0;top:0;width:466px;height:781px;box-sizing:border-box;border-radius:72px;background:#183727;border:1px solid #2c4d3a;box-shadow:0 26px 50px rgba(23,49,30,.28)', ph);
    [[140, 46], [200, 90]].forEach(([y, h]) => SK.el('div', `left:-6px;top:${y}px;width:7px;height:${h}px;border-radius:4px;background:#183727`, ph));
    SK.el('div', 'left:465px;top:190px;width:7px;height:130px;border-radius:4px;background:#183727', ph);
    const scr = SK.el('div', 'left:10px;top:10px;width:446px;height:761px;border-radius:62px;overflow:hidden;background:#000', ph);
    const cv = SK.el('canvas', 'left:0;top:-16px;width:446px;height:793px', scr); cv.width = 446; cv.height = 793; const cx = cv.getContext('2d');
    SK.el('div', `left:30px;top:640px;right:30px;height:90px;background:linear-gradient(transparent,rgba(0,0,0,.55))`, scr);
    const time = SK.el('div', `left:36px;top:662px;font:500 25px/30px ${F.mono};color:#fff`, scr, '0:07 <span style="opacity:.55">/ 0:32</span>');
    SK.el('div', 'left:36px;top:710px;width:374px;height:4px;border-radius:2px;background:rgba(255,255,255,.3)', scr);
    SK.el('div', 'left:36px;top:710px;width:100px;height:4px;border-radius:2px;background:#fff', scr); SK.el('div', 'left:130px;top:704px;width:16px;height:16px;border-radius:8px;background:#fff', scr);
    const dm = SK.el('div', 'left:-143px;top:810px;width:752px;height:200px;overflow:hidden', ph);
    const dv = SK.el('div', `left:0;top:0;width:752px;text-align:center;font:400 250px/200px ${F.serif};color:#17311E`, dm, '<span style="display:inline-block;transform:scaleX(.72)">DIVE</span>');
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const f = Math.round((t - o.t0) * 30); tc.textContent = SK.tc(o.tc0 + f);
      const rise = (e, a) => { const k = K.step(t - a, 330, 30); e.style.transform = `translateY(${(1 - K.clamp(k, 0, 1.05)) * 210}px)`; e.parentNode.style.visibility = t >= a ? 'visible' : 'hidden'; };
      rise(wT, o.title); rise(wC, o.card); rule.style.opacity = SK.ramp(t, o.card + .1, o.card + .2);
      const pk = K.step(t - o.phone, 230, 22), big = 2.1 - 1.1 * K.clamp(pk, 0, 1.08);   // from big to normal
      const zk = SK.ease((t - o.zoom) / (o.end - o.zoom)), zs = 1 + 1.55 * zk * zk;
      ph.style.display = t >= o.phone ? 'block' : 'none'; ph.style.transform = `translate(${(1 - K.clamp(pk, 0, 1)) * -90}px,${(1 - K.clamp(pk, 0, 1)) * 70}px) scale(${big * zs})`;
      if (t >= o.phone) opts.foot.paint(cx, 446, 793);
      rise(dv, o.dive); dm.style.opacity = 1 - .35 * zk; dv.style.color = zk > 0 ? `rgb(${23 + 115 * zk | 0},${49 + 109 * zk | 0},${30 + 109 * zk | 0})` : '#17311E';
      dm.style.visibility = t >= o.dive ? 'visible' : 'hidden';
    } };
  },
});
