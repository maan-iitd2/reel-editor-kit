// effects/lib/comment-drop.js
// doc: the CTA moment. Huge "EDIT" slides in above an IG comment box, its letters fall into the field, the comment posts
//   ("handle - now / EDIT to get access to these + 50 more"), hearts tick up, a "you - EDIT" reply drops under it, then all fades.
//   Trigger: the spoken word "edit" of "comment edit" (visual lands ~0.2 s before it is said). Source: reel DfnvcS1OdZi 10.73-13.47 s (E10).
//   opts: t0 (box in), type (letters fall), post, out, handle, word, hearts [[t,count]...]. Cards x 45-725, y 185-455 (top zone, as in the source).
K.register('comment-drop', {
  needs: [],
  doc: 'huge EDIT drops into an IG comment box and posts; hearts tick; reply card',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front');
    const o = Object.assign({ t0: 10.73, type: 11.10, post: 11.30, heartIn: 11.50, reply: 12.0, out: 13.40, handle: 'justyn.ai', word: 'EDIT',
      hearts: [[11.70, 1], [11.80, 2], [12.0, 3], [12.2, 4], [12.5, 5], [12.7, 6], [13.1, 7], [13.2, 8]] }, opts);
    const F = SK.FONT, ui = `font-family:${F.ui};`;
    const heart = (c) => `<svg width="38" height="34" viewBox="0 0 24 22"><path d="M12 21 C-6 9 4 -3 12 5 C20 -3 30 9 12 21Z" fill="${c === 'o' ? 'none' : '#A8475A'}" stroke="${c === 'o' ? '#B0B0B0' : '#A8475A'}" stroke-width="1.8"/></svg>`;
    const avatar = (bg, inner, s = 66) => `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${bg};overflow:hidden;display:flex;align-items:flex-end;justify-content:center">${inner}</div>`;
    const sharkAv = `<svg width="66" height="66" viewBox="0 0 66 66"><polygon points="33,6 42,28 26,28" fill="#7C98AC"/><ellipse cx="33" cy="42" rx="23" ry="17" fill="#B9CFDC"/><circle cx="26" cy="38" r="2.6" fill="#111"/><circle cx="40" cy="38" r="2.6" fill="#111"/><path d="M24 48 Q33 54 42 48" stroke="#7A2230" stroke-width="3" fill="none"/></svg>`;
    const grey = `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="22" r="10" fill="#E8F0EA"/><ellipse cx="28" cy="52" rx="18" ry="16" fill="#E8F0EA"/></svg>`;
    // big word
    const big = SK.el('div', `left:150px;top:92px;font:400 215px/1 ${F.black};color:#F6F2E6;white-space:nowrap;letter-spacing:-.02em;transform-origin:0 0;transform:scaleX(.66)`, L);
    const letters = [...o.word].map(ch => SK.el('span', 'position:relative;display:inline-block', big, ch));
    // card 1
    const c1 = SK.el('div', `left:45px;top:185px;width:680px;height:155px;border-radius:36px;background:#FCFCFC;box-shadow:0 14px 34px rgba(0,0,0,.35);${ui}overflow:hidden`, L);
    SK.el('div', 'left:24px;top:22px', c1, avatar('#B8F0C8', sharkAv));
    const ph = SK.el('div', `left:120px;top:56px;font:500 27px/40px ${F.ui};color:#9A9A9A`, c1, 'Add a comment...');
    const typed = SK.el('div', `left:120px;top:52px;font:600 32px/44px ${F.ui};color:#111;white-space:nowrap`, c1, '');
    const postBtn = SK.el('div', `right:26px;top:56px;width:96px;height:44px;border-radius:22px;background:#E3E3E3;color:#999;font:600 23px/44px ${F.ui};text-align:center`, c1, 'Post');
    const head = SK.el('div', `left:120px;top:20px;font:600 21px/28px ${F.ui};color:#111;white-space:nowrap`, c1, `${o.handle} <span style="color:#8A8A8A;font-weight:500">&middot; now</span>`);
    const body = SK.el('div', `left:120px;top:54px;font:500 30px/38px ${F.ui};color:#111;white-space:nowrap`, c1, `<b style="font-weight:600;-webkit-text-stroke:.8px #111">${o.word}</b> to get access to these<br>+ 50 more`);
    const hrt = SK.el('div', 'right:34px;top:34px;text-align:center', c1, ''); const hcount = SK.el('div', `right:42px;top:74px;font:500 21px/24px ${F.ui};color:#777;width:22px;text-align:center`, c1, '');
    // reply
    const c2 = SK.el('div', `left:125px;top:354px;width:600px;height:101px;border-radius:30px;background:#FCFCFC;box-shadow:0 10px 26px rgba(0,0,0,.3);overflow:hidden`, L);
    SK.el('div', 'left:14px;top:22px', c2, avatar('#7C9C86', grey, 56));
    SK.el('div', `left:88px;top:16px;font:600 20px/26px ${F.ui};color:#111`, c2, `you <span style="color:#8A8A8A;font-weight:500">&middot; now</span>`);
    SK.el('div', `left:88px;top:42px;font:600 36px/48px ${F.ui};color:#183727;-webkit-text-stroke:1px #183727`, c2, o.word);
    const h2 = SK.el('div', 'right:30px;top:20px', c2, ''); const h2c = SK.el('div', `right:38px;top:58px;font:500 21px/24px ${F.ui};color:#777;width:22px;text-align:center`, c2, '');
    return { seek(t) {
      const a = K.sp(t, o.t0, K.P.UI), out = 1 - SK.ramp(t, o.out, o.out + .08), live = t >= o.t0 && t < o.out + .1;
      [big, c1, c2].forEach(e => e.style.display = live ? 'block' : 'none'); if (!live) return;
      const up = K.sp(t, o.post, K.P.BOX); c1.style.opacity = K.clamp(a) * out; c1.style.transform = `translateY(${(1 - K.clamp(a, 0, 1.1)) * -70 + 100 * (1 - K.clamp(up, 0, 1.05))}px)`;
      // big word: in at t0 from left, letters drop into the field from `type`
      big.style.opacity = out;
      letters.forEach((s, i) => { const d = o.type + i * .035, k = SK.sm((t - d) / .14), inn = K.sp(t, o.t0 + .02 + i * .015, K.P.UI);
        s.style.transform = `translate(${(1 - K.clamp(inn, 0, 1.05)) * -520}px,${k * 330}px) scale(${1 - .7 * k})`; s.style.opacity = (1 - k) * K.clamp(inn * 2); });
      const n = Math.max(0, Math.min(o.word.length, Math.floor((t - o.type - .03) / .035) + 1)); const posted = t >= o.post;
      typed.textContent = o.word.slice(0, n); typed.style.display = posted ? 'none' : 'block';
      ph.style.display = (n > 0 || posted) ? 'none' : 'block'; const cur = (Math.floor(t * 4) % 2 === 0) && n > 0 && !posted ? '|' : ''; typed.textContent += cur;
      const pk = SK.ramp(t, o.type + .1, o.type + .16); postBtn.style.background = pk > .5 ? '#183727' : '#E3E3E3'; postBtn.style.color = pk > .5 ? '#fff' : '#999';
      postBtn.style.display = posted ? 'none' : 'block'; head.style.display = body.style.display = posted ? 'block' : 'none';
      const pp = K.sp(t, o.post, K.P.UI); body.style.opacity = head.style.opacity = K.clamp(pp); body.style.transform = `scale(${1.04 - .04 * K.clamp(pp, 0, 1)})`; body.style.transformOrigin = '0 0';
      const cnt = o.hearts.reduce((v, h) => t >= h[0] ? h[1] : v, 0), hk = t >= o.heartIn;
      hrt.innerHTML = hk && posted ? heart(cnt ? 'f' : 'o') : ''; hcount.textContent = hk && posted ? (cnt || '') : '';
      const r = K.sp(t, o.reply, K.P.UI); c2.style.opacity = K.clamp(r) * out; c2.style.transform = `translateY(${(1 - K.clamp(r, 0, 1.1)) * -40}px)`;
      h2.innerHTML = heart(t >= o.reply + .3 ? 'f' : 'o'); h2c.textContent = t >= o.reply + .3 ? '1' : '';
    } };
  },
});
