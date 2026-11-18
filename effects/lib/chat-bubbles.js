// chat-bubbles: a beat card (thumbnail pair + quote) drops in, then a cream chat card appears: your message types out, Claude's reply drops in below and the card grows.
// Trigger: "make any changes, I just explain what I want to see". Source: justyn.ai DfbHxfMNsOr FEATURES F18 (beat card 505x175, chat 485x191 of 1276, Justyn/Claude rows).
// opts: {t0 (beat card), tChat, typeFrom, typeTo, tReply, t1, me:'Shark', beat:{id,time,label,quote,rows}, msg, reply, thumbs:{room,shark}, layer}
K.register('chat-bubbles', {
  needs: [], doc: 'beat card + chat thread: typed message, Claude reply drops in, card grows',
  create(stage, o) {
    const { P, F, el } = K.kit, host = el('div', 'position:absolute;inset:0;display:none', o.layer || stage);
    const card = (css, p) => el('div', `position:absolute;${css};background:${P.cream};border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.45);box-sizing:border-box;overflow:hidden`, p || host);
    const bc = card('left:50px;top:250px;width:880px;height:150px');
    const th = el('div', `position:absolute;left:18px;top:14px;width:76px;height:122px;border-radius:6px;background:#111 url(${o.thumbs.room}) 50% 22%/76px auto`, bc); el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 22%/76px auto`, th);
    const th2 = el('div', `position:absolute;left:104px;top:14px;width:216px;height:122px;border-radius:6px;background:#111 url(${o.thumbs.room}) 50% 16%/216px auto`, bc); el('div', `position:absolute;inset:0;background:url(${o.thumbs.shark}) 50% 16%/216px auto`, th2);
    el('div', `position:absolute;left:340px;top:18px;font:500 17px ${F.mono};color:#3a362f`, bc).innerHTML = `<b>${o.beat.id}</b> ${o.beat.time} <span style="background:#e2d9c8;padding:1px 7px;border-radius:4px">${o.beat.label}</span>`;
    el('div', `position:absolute;left:340px;top:52px;width:520px;font:italic 400 32px/1.15 ${F.gar};color:#1f1d19`, bc, '“' + o.beat.quote + '”'); el('div', `position:absolute;left:340px;top:116px;font:500 17px ${F.mono};color:#6a6559`, bc, o.beat.rows);
    const cc = card('left:50px;top:420px;width:880px;height:300px');
    const av = (bg, ch, top) => el('div', `position:absolute;left:30px;top:${top}px;width:44px;height:44px;border-radius:50%;background:${bg};text-align:center;font:700 24px/44px ${F.ui};color:#fff`, cc, ch);
    av('#2f8f6a', 'S', 22); el('div', `position:absolute;left:92px;top:24px;font:700 28px ${F.ui};color:#1b1b1a`, cc).innerHTML = `${o.me} <span style="font:500 22px ${F.ui};color:#999;margin-left:6px">now</span>`;
    const msg = el('div', `position:absolute;left:30px;top:78px;width:820px;font:500 31px/1.34 ${F.ui};color:#1b1b1a`, cc);
    const div = el('div', 'position:absolute;left:30px;right:30px;top:190px;height:1px;background:#d9d0bf', cc);
    const rp = el('div', 'position:absolute;inset:0;top:196px', cc); av('#C7A259', 'C', 8).style.top = '212px'; cc.lastChild.style.top = '212px';
    el('div', `position:absolute;left:92px;top:214px;font:700 28px ${F.ui};color:#1b1b1a`, cc, 'Claude'); const rep = el('div', `position:absolute;left:30px;top:262px;width:820px;font:500 31px/1.3 ${F.ui};color:#1b1b1a`, cc);
    const kids = [div, rep, cc.children[cc.children.length - 3], cc.children[cc.children.length - 4]];
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.15; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const b = K.sp(t, o.t0, K.P.BOX), c = K.sp(t, o.tChat, K.P.UI), x = K.sp(t, o.t1 - 0.05, K.P.OUT), r = K.sp(t, o.tReply, K.P.BOX);
      bc.style.opacity = K.clamp(b * 2) * (1 - x); bc.style.transform = `translateY(${(1 - b) * -300}px)`;
      cc.style.opacity = K.clamp(c * 2) * (1 - x); cc.style.transform = `translateY(${(1 - c) * -80}px) scale(${0.9 + 0.1 * c})`; cc.style.height = (150 + 150 * r) + 'px';
      msg.textContent = o.msg.slice(0, Math.floor(K.clamp((t - o.typeFrom) / (o.typeTo - o.typeFrom)) * o.msg.length)); rep.textContent = o.reply;
      [div, rep].forEach(e => e.style.opacity = K.clamp(r * 2)); cc.querySelectorAll('div').forEach(e => { if (e.style.top === '212px') e.style.opacity = K.clamp(r * 2); });
    } }; },
});
