// comment-reply-card: an IG-style comment composer (white pill) types the CTA keyword, posts it (heart outline), a reply "Sending it over." drops in beneath, the heart fills red, card lifts out.
// Trigger: "just comment SHARK down below and I'll send it over". Source: justyn.ai DfbHxfMNsOr FEATURES F23 (composer 410x65 of 1276, EDIT typed 3 frames/letter, reply drops 0.3 s later).
// Own slug (not comment-drop, owned by the other reel). opts: {t0,tType:[a,b],tPost,tReply,tHeart,t1,text,reply,handle,x:70,y:250,w:760, layer}
K.register('comment-reply-card', {
  needs: [], doc: 'white comment composer types the keyword, posts, reply drops in, heart fills',
  create(stage, o) {
    const { P, F, el } = K.kit, X = o.x || 70, Y = o.y || 250, W = o.w || 760, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const box = el('div', `position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:92px;border-radius:46px;background:#fff;box-shadow:0 16px 44px rgba(0,0,0,.4);overflow:hidden;transform-origin:0 0`, host);
    const av = el('div', 'position:absolute;left:20px;top:22px;width:48px;height:48px;border-radius:50%;background:#8fb09c', box);
    const meta = el('div', `position:absolute;left:84px;top:12px;font:500 17px ${F.ui};color:#9a9a9a;display:none`, box, 'you · now');
    const txt = el('div', `position:absolute;left:84px;top:28px;font:700 38px/38px ${F.ui};color:#111`, box);
    const send = el('div', `position:absolute;right:20px;top:22px;width:48px;height:48px;border-radius:50%;background:#d8d8d8;text-align:center;font:700 28px/46px ${F.ui};color:#fff`, box, '↑');
    const heart = el('div', `position:absolute;right:28px;top:26px;font:400 40px ${F.ui};color:#777;display:none`, box, '♡');
    const rep = el('div', `position:absolute;left:${X + 30}px;top:${Y + 78}px;width:${W - 30}px;height:84px;border-radius:30px;background:#fff;box-shadow:0 12px 34px rgba(0,0,0,.35);display:none`, host);
    const rav = el('div', 'position:absolute;left:18px;top:18px;width:48px;height:48px;border-radius:50%;background:#2f8f6a;text-align:center;font:700 26px/48px ' + F.ui + ';color:#fff', rep, 'S');
    el('div', `position:absolute;left:84px;top:10px;font:500 17px ${F.ui};color:#9a9a9a`, rep, o.handle + ' · now'); el('div', `position:absolute;left:84px;top:34px;font:700 32px ${F.ui};color:#111`, rep, o.reply);
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.1; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, K.P.UI), x = K.sp(t, o.t1 - 0.05, K.P.OUT), posted = t >= o.tPost, r = K.sp(t, o.tReply, [260, 22]), h = K.sp(t, o.tHeart, [500, 18]);
      host.style.opacity = K.clamp(e * 2) * (1 - K.clamp(x)); host.style.transform = `translateY(${(1 - e) * -30 - x * 20}px)`;
      const n = Math.floor(K.clamp((t - o.tType[0]) / (o.tType[1] - o.tType[0])) * o.text.length), caret = !posted && Math.floor(t * 2.2) % 2 === 0 ? '|' : '';
      txt.textContent = n ? o.text.slice(0, n) + caret : (posted ? o.text : (caret ? '' : '') + 'Add a comment…'); txt.style.color = n || posted ? '#111' : '#aaa'; txt.style.font = n || posted ? `700 38px/38px ${F.ui}` : `500 28px/38px ${F.ui}`;
      if (!posted && !n) txt.style.top = '28px'; send.style.background = n && !posted ? '#173027' : '#d8d8d8'; send.style.display = posted ? 'none' : 'block';
      meta.style.display = heart.style.display = posted ? 'block' : 'none'; txt.style.top = posted ? '38px' : '28px'; box.style.height = (posted ? 100 : 92) + 'px';
      const filled = t >= o.tHeart; heart.textContent = filled ? '♥' : '♡'; heart.style.color = filled ? '#C4524D' : '#777'; heart.style.transform = `scale(${filled ? 1 + 0.5 * (1 - Math.min(1, h)) : 1})`;
      rep.style.display = r > 0.01 ? 'block' : 'none'; rep.style.opacity = K.clamp(r * 2); rep.style.transform = `translateY(${(1 - r) * -50}px)`; } }; },
});
