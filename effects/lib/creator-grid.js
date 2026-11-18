// creator-grid: hard cut to a flat brand-green scene: the footage shrinks into a centre window and reel posters from other creators fly in from both sides in a stagger;
// the window then zooms back to full frame while the posters stay behind. (Grid collapse.) The caption in this scene is bare text on green (karaoke-captions noBox).
// Trigger: "lots of creators are doing this right now ... but my way". Source: justyn.ai DfbHxfMNsOr FEATURES F15 (bg #193028, window 0.43 of the frame, 12 posters 2x3 per side).
// opts: {layers:{bg,ui}, t0, tZoom, t1, scale:0.40}; writes K.foot part 'grid'. Posters are CSS stand-ins for reels.
K.register('creator-grid', {
  needs: ['subject', 'clean'], doc: 'flat green scene, footage shrinks to a window, 12 posters fly in, window zooms back',
  create(stage, o) {
    const { P, F, el } = K.kit, s0 = o.scale || 0.4, bg = el('div', 'position:absolute;inset:0;background:#193028;display:none', o.layers.bg), host = el('div', 'position:absolute;inset:0;display:none', o.layers.ui);
    const TH = [['#e8590c', 'Claude edited this'], ['#101820', 'Motion Design'], ['#1c1c2e', 'video prompts'], ['#2d4a3e', 'Claude can edit videos'], ['#f4c20d', 'Cooked'], ['#0e1a3a', 'CLAUDE'],
      ['#6b1d2e', 'edited in 1 sentence'], ['#222', 'killed it'], ['#f2efe6', 'AI video'], ['#16324a', 'storyboard first'], ['#3a2a10', 'one prompt'], ['#0b3d2a', 'no CapCut']];
    const pw = 132, ph = 235, gx = [10, 150, 782, 922], gy = [520, 790, 1060];
    const ps = TH.map((q, i) => { const side = i < 6 ? 0 : 1, col = side * 2 + (i % 2), row = Math.floor((i % 6) / 2), light = q[0] === '#f4c20d' || q[0] === '#f2efe6';
      const d = el('div', `position:absolute;left:${gx[col]}px;top:${gy[row]}px;width:${pw}px;height:${ph}px;border-radius:10px;background:${q[0]};overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.4)`, host);
      el('div', `position:absolute;left:8px;right:8px;top:14px;font:800 20px/1.1 ${F.ui};color:${light ? '#111' : '#fff'};text-align:center`, d, q[1]); el('div', 'position:absolute;left:26%;right:26%;top:48%;height:32%;border-radius:50% 50% 8px 8px;background:rgba(255,255,255,.2)', d);
      return { d, side, k: i }; });
    return { seek(t) {
      const on = t >= o.t0 && t < o.t1 + 0.4; bg.style.display = host.style.display = on ? 'block' : 'none';
      if (!on) { K.foot.set('grid', {}); return; }
      const z = K.sp(t, o.tZoom, [190, 22]), e = K.sp(t, o.t0, [300, 26]), s = K.lerp(K.lerp(0.55, s0, e), 1, z);
      K.foot.set('grid', { s, ox: 540, oy: 960 });
      ps.forEach(q => { const a = K.sp(t, o.t0 + 0.12 + q.k * 0.035, K.P.BOX), cov = K.clamp((z - 0.35) * 2.5);
        q.d.style.opacity = K.clamp(a * 2) * (1 - cov); q.d.style.transform = `translateX(${(1 - a) * (q.side ? 420 : -420)}px) scale(${0.85 + 0.15 * a})`; });
      bg.style.opacity = 1 - K.clamp((z - 0.9) * 10); } }; },
});
