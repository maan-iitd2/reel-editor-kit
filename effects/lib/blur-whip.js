// blur-whip: the cut-hiding blur: blur ramps up in ~3 frames, the film swaps the framing at the peak, blur falls away in ~5 frames (footage only; UI and captions stay sharp).
// kinds: 'h' horizontal motion blur, 'v' vertical, 'r' round gaussian (defocus punch, with an optional scale pulse). Trigger: a phrase boundary.
// Source: justyn.ai DfbHxfMNsOr FEATURES S3 (six whips: 2.67, 14.50, 22.07, 30.15, 35.80, 49.60) and F16 (defocus punch). opts: {whips:[{t, dur, kind, peak, pulse}]}
// The peak time of a whip is t + dur*0.4 (K.fx['blur-whip'].peak(w)); put punch-in cues there.
K.register('blur-whip', {
  needs: ['subject', 'clean'], doc: 'blur ramps 0 to peak to 0 around a framing swap; horizontal, vertical or round',
  peak: w => w.t + (w.dur || 0.26) * 0.4,
  create(stage, o) {
    const piv = o.pivot || [540, 800];
    return { seek(t) {
      let sx = 0, sy = 0, sc = 1;
      for (const w of o.whips) { const d = w.dur || 0.26, u = (t - w.t) / d; if (u < 0 || u > 1) continue;
        const k = u < 0.4 ? u / 0.4 : Math.max(0, 1 - (u - 0.4) / 0.6), e = k * k * (3 - 2 * k), pk = (w.peak || 34) * e;
        if (w.kind === 'v') sy = pk; else if (w.kind === 'r') { sx = pk * 0.8; sy = pk * 0.8; } else sx = pk;
        if (w.pulse) sc = 1 + (w.pulse - 1) * e; }
      K.kit.setWhip(sx, sy);
      K.foot.set('whip', sx + sy > 0.05 ? { filter: 'url(#kwhip)', s: sc, ox: piv[0], oy: piv[1] } : {}); } };
  },
});
