// effects/lib/rack-focus.js
// doc: the background goes heavily out of focus (gaussian blur ramps up, slight push-in) while the person stays sharp, holds,
//   then snaps back sharp. Contributes to SK.frame.room.blur/scale. Trigger: "rack focus". Needs the person matte + separate background.
//   Source: reel DfnvcS1OdZi 18.30-19.43 s (E15): blur in 18.30-18.50, hold, out 19.20-19.40; ~18 px blur at 1080.
K.register('rack-focus', {
  needs: ['clean', 'subject'],
  doc: 'background blur ramps in/out behind a sharp person',
  create(stage, opts) {
    const o = Object.assign({ t0: 18.30, full: 18.50, outA: 19.20, outB: 19.40, blur: 20, push: 1.05 }, opts);
    return { seek(t) {
      if (t < o.t0 || t > o.outB + .05) return;
      const k = SK.sm((t - o.t0) / (o.full - o.t0)) * (1 - SK.sm((t - o.outA) / (o.outB - o.outA)));
      const R = SK.frame.room; R.blur = Math.max(R.blur, o.blur * k); R.scale = Math.max(R.scale, 1 + (o.push - 1) * k);
    } };
  },
});
