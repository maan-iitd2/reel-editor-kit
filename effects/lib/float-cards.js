// float-cards: vertical reel thumbnails float in around the head (staggered springs from above), idle-bob while they hold, then leave on the next cut.
// Trigger: "my best videos float in". Source: justyn.ai DfbHxfMNsOr FEATURES F6 (3 cards of slightly different sizes, no border, radius ~4, bob ~3 px).
// opts: {cards:[{x,y,w,h,t0,theme:0..3,head,sub}], tEnd}. Cards are CSS stand-ins for reel screenshots (headline in a white pill over a colour block).
K.register('float-cards', {
  needs: [], doc: 'three reel-style cards float in from above, bob, and leave',
  create(stage, o) {
    const { P, F, el } = K.kit, host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const TH = [['#2a1a2e', '#c04a7a'], ['#12212e', '#2f7fb5'], ['#2b1d12', '#e08a2c'], ['#14281f', '#3fb07a']];
    const cards = o.cards.map(c => { const th = TH[c.theme || 0], d = el('div', `position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;border-radius:12px;overflow:hidden;background:linear-gradient(170deg,${th[0]},${th[1]});box-shadow:0 18px 40px rgba(0,0,0,.45)`, host);
      el('div', `position:absolute;left:12px;right:12px;top:14px;padding:8px 10px;border-radius:8px;background:#fff;color:#111;font:700 ${Math.round(c.w / 11)}px/1.15 ${F.ui};text-align:center`, d, c.head);
      el('div', `position:absolute;left:18%;right:18%;top:44%;height:30%;border-radius:50% 50% 14px 14px;background:rgba(255,255,255,.16)`, d);
      el('div', `position:absolute;left:12px;bottom:12px;font:600 ${Math.round(c.w / 14)}px ${F.ui};color:rgba(255,255,255,.85)`, d, c.sub);
      return { c, d }; });
    return { seek(t) {
      host.style.display = t >= o.cards[0].t0 - 0.05 && t < o.tEnd + 0.05 ? 'block' : 'none';
      cards.forEach((q, i) => { const e = K.sp(t, q.c.t0, K.P.BOX), x = K.sp(t, o.tEnd - 0.04, K.P.OUT);
        q.d.style.opacity = K.clamp(e * 1.6) * (1 - x); q.d.style.transform = `translate(0,${(1 - e) * -260 + Math.sin(t * 2.2 + i * 2) * 4}px) rotate(${(1 - e) * (i % 2 ? 6 : -6)}deg)`; }); } }; },
});
