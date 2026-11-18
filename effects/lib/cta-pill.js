// cta-pill: a white rounded pill at the top with the CTA line in heavy sans ("Comment "SHARK" and I'll send you the walkthrough"); pops in once and stays to the end.
// Trigger: the spoken CTA ("And if not already..." / the comment-card exit). Source: justyn.ai DfbHxfMNsOr FEATURES F24 (pill 908x58 of 1276, Inter ExtraBold ~38).
// opts: {t0, t1, text, y:250, layer}. Sits at y 250 to clear the IG top zone (220); width trimmed to 880.
K.register('cta-pill', {
  needs: [], doc: 'static white CTA pill at the top, one spring pop',
  create(stage, o) {
    const { F, el } = K.kit, d = el('div', `position:absolute;left:100px;top:${o.y || 250}px;width:880px;height:92px;border-radius:22px;background:#fff;color:#0B0B0B;text-align:center;font:800 36px/92px ${F.ui};letter-spacing:-.025em;white-space:nowrap;box-shadow:0 12px 34px rgba(0,0,0,.35);-webkit-text-stroke:.6px #0B0B0B`, o.layer || stage, o.text);
    return { seek(t) { const on = t >= o.t0 && t < (o.t1 || 1e9); d.style.display = on ? 'block' : 'none'; if (!on) return; const e = K.sp(t, o.t0, K.P.UI); d.style.opacity = K.clamp(e * 3); d.style.transform = `translateY(${(1 - e) * -40}px) scale(${0.94 + 0.06 * e})`; } }; },
});
