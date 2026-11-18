// effects/lib/dolly-zoom.js
// doc: vertigo shot: the BACKGROUND swells to ~1.8x about the head while the person stays at constant scale, relaxes slowly,
//   then snaps back with a blur. Contributes to SK.frame.room (scale/origin/blur) so the person plate is untouched.
//   Trigger: "dolly zoom". Needs a separate background (clean room plate) and the person matte.
//   Source: reel DfnvcS1OdZi 5.73-6.90 s (E06): swell 5.73-6.20 (peak ~1.8x), relax to ~1.5x by 6.57, snap to 1.14x at 6.80, 1.0x at 6.90.
K.register('dolly-zoom', {
  needs: ['clean', 'subject'],
  doc: 'background scales up ~1.8x behind a constant-size person, snaps back blurred',
  create(stage, opts) {
    const o = Object.assign({ t0: 5.73, peak: 1.8, relax: 1.5, snap: 6.70, end: 6.90, ox: 540, oy: 700 }, opts);
    return { seek(t) {
      if (t < o.t0 || t > o.end + .3) return;
      const up = K.step(t - o.t0, 150, 19), down = SK.sm((t - (o.t0 + .47)) / .37), back = K.step(t - o.snap, 380, 34);
      let s = 1 + (o.peak - 1) * K.clamp(up, 0, 1.06); s -= (o.peak - o.relax) * down; s = o.relax * 0 + s; s = 1 + (s - 1) * (1 - K.clamp(back, 0, 1)) + 0.0 * back;
      const R = SK.frame.room; R.scale = Math.max(1, s); R.ox = o.ox; R.oy = o.oy; R.blur = Math.max(R.blur, 7 * Math.exp(-Math.pow((t - (o.snap + .05)) / .06, 2)));
    } };
  },
});
