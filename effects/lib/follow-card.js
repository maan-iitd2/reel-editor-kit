// follow-card: a translucent dark-green profile pill (avatar, handle, tagline) pops in over the shark; its cream "Follow" button greys, then becomes "Following" with a check.
// Trigger: "make sure to follow me". Source: justyn.ai DfbHxfMNsOr FEATURES F25 (pill 461x77 of 1276, ~92% opaque so the shirt shows through, Follow -> Following at +0.5 s).
// opts: {t0, tPress, tDone, t1, handle:'sharky.ai', tag:'Daily AI tips', x:150, y:1290, layer}  (handle is a stand-in, not a real account)
K.register('follow-card', {
  needs: [], doc: 'profile pill with Follow button that flips to Following',
  create(stage, o) {
    const { P, F, el } = K.kit, W = 780, H = 112, d = el('div', `position:absolute;left:${o.x || 150}px;top:${o.y || 1290}px;width:${W}px;height:${H}px;border-radius:56px;background:rgba(36,62,51,.93);box-shadow:0 16px 44px rgba(0,0,0,.4);transform-origin:50% 50%;display:none`, o.layer || stage);
    el('div', `position:absolute;left:14px;top:14px;width:84px;height:84px;border-radius:50%;background:#6FD6A0;overflow:hidden`, d).innerHTML = `<div style="position:absolute;left:18px;top:14px;width:48px;height:60px;border-radius:50% 50% 40% 40%;background:#a9c7d6"></div><div style="position:absolute;left:36px;top:2px;width:10px;height:22px;background:#8fb1c2;clip-path:polygon(0 100%,100% 100%,50% 0)"></div>`;
    el('div', `position:absolute;left:118px;top:20px;font:700 34px ${F.ui};color:#fff`, d, o.handle); const tg = el('div', `position:absolute;left:118px;top:62px;font:500 26px ${F.ui};color:rgba(255,255,255,.62)`, d, o.tag);
    const b = el('div', `position:absolute;right:16px;top:16px;width:230px;height:80px;border-radius:40px;background:#ECE6DC;color:#111;text-align:center;font:700 32px/80px ${F.ui}`, d, 'Follow');
    return { seek(t) {
      const on = t >= o.t0 && t < (o.t1 || 1e9); d.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, K.P.UI), done = t >= o.tDone, pr = t >= o.tPress;
      d.style.opacity = K.clamp(e * 3) * .98; d.style.transform = `scale(${0.88 + 0.12 * Math.min(1.05, e)}) translateY(${(1 - e) * 30 + Math.sin(t * 1.7) * 2}px)`;
      b.textContent = done ? '✓ Following' : 'Follow'; b.style.background = done ? 'rgba(255,255,255,.18)' : pr ? '#9a968d' : '#ECE6DC'; b.style.color = done ? '#fff' : '#111'; b.style.transform = `scale(${pr && !done ? 0.94 : 1})`; tg.style.opacity = done ? 1 : 0.0; } }; },
});
