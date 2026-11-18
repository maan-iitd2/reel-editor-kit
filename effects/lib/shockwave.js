// effects/lib/shockwave.js
// doc: a radial refraction ring expands from the chest across the BACKGROUND (picture frame and wall bend and bulge) while the
//   person stays undistorted. Contributes SK.frame.room.wave (radius, width, amplitude); room-set does the pixel warp.
//   Trigger: "shockwave". Needs the person matte + separate background. Source: reel DfnvcS1OdZi 13.47-13.87 s (E11).
K.register('shockwave', {
  needs: ['clean', 'subject'],
  doc: 'background-only radial displacement ring',
  create(stage, opts) {
    const o = Object.assign({ t0: 13.47, dur: 0.42, cx: 520, cy: 760, r1: 1250, amp: 70, width: 150 }, opts);
    return { seek(t) {
      if (t < o.t0 || t > o.t0 + o.dur) return;
      const p = (t - o.t0) / o.dur, r = o.r1 * (1 - Math.pow(1 - p, 2.2)), amp = o.amp * (1 - p) * Math.min(1, p * 8);
      SK.frame.room.wave = { cx: o.cx, cy: o.cy, r, w: o.width * (.6 + p), amp };
    } };
  },
});
