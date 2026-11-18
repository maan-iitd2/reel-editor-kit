// big-timer: a green panel with tall-serif digits that roll like an odometer from the raw length to the finished length (1:07 -> 0:52), RAW TAKE label in gold mono.
// Trigger: "a few minutes later, you get exactly...". Source: justyn.ai DfbHxfMNsOr FEATURES F11 (panel 318x130 of 1276, digits ~100 px, wipe-in from the left).
// opts: {t0, roll:[a,b], t1, from:67, to:52, x:70, y:260}
K.register('big-timer', {
  needs: [], doc: 'green timer panel, serif digits roll from 1:07 to 0:52, gold RAW TAKE label',
  create(stage, o) {
    const { P, F, el } = K.kit, W = 380, H = 190, host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const pan = el('div', `position:absolute;left:${o.x || 70}px;top:${o.y || 260}px;width:${W}px;height:${H}px;border-radius:24px;background:#173027;box-shadow:0 20px 50px rgba(0,0,0,.45);overflow:hidden;transform-origin:0 50%`, host);
    el('div', `position:absolute;left:0;right:0;top:12px;text-align:center;font:500 17px ${F.mono};letter-spacing:.3em;color:${P.gold}`, pan, 'RAW TAKE');
    const cols = [0, 1, 2].map(i => el('div', `position:absolute;top:30px;height:150px;width:${i === 1 ? 84 : 92}px;left:${[40, 176, 262][i]}px;overflow:hidden`, pan));
    const colon = el('div', `position:absolute;left:138px;top:34px;font:400 120px/140px ${F.disp};color:${P.cream}`, pan, ':');
    const spans = cols.map(c => [0, 1].map(() => el('div', `position:absolute;left:0;right:0;text-align:center;font:400 150px/150px ${F.disp};color:${P.cream}`, c)));
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.1; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const e = K.sp(t, o.t0, K.P.BOX), x = K.sp(t, o.t1 - 0.05, K.P.OUT); pan.style.opacity = K.clamp(e * 2) * (1 - x); pan.style.transform = `scaleX(${0.2 + 0.8 * Math.min(1.03, e)})`;
      const p = K.clamp((t - o.roll[0]) / (o.roll[1] - o.roll[0])), v = K.lerp(o.from, o.to, p * p * (3 - 2 * p)), f = Math.floor(v), fr = v - f;
      const show = (ci, cur, prev, k) => { spans[ci][0].textContent = cur; spans[ci][1].textContent = prev; spans[ci][0].style.transform = `translateY(${-(1 - k) * 100}%)`; spans[ci][1].style.transform = `translateY(${k * 100}%)`; spans[ci][1].style.opacity = k < 1 ? 1 : 0; };
      const dg = n => [Math.floor(n / 60), Math.floor(n % 60 / 10), n % 10], c = dg(f), pv = dg(f + 1);
      // the ones digit rolls every second; tens/minutes roll when they change
      show(0, c[0], pv[0], c[0] !== pv[0] ? 1 - fr : 1); show(1, c[1], pv[1], c[1] !== pv[1] ? 1 - fr : 1); show(2, c[2], pv[2], 1 - fr); } }; },
});
