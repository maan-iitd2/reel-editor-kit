// punch-in: digital camera framing on the footage (room + shark together): hard-cut scale steps, an optional slow push, optional spring settle.
// Trigger: phrase boundaries (he cuts or punches on a new phrase; about every 2-4 s). Levels used: 1.0 wide, 1.5 medium, 1.75 close, push +7 %/s.
// Source: justyn.ai DfbHxfMNsOr FEATURES S2. opts: {pivot:[x,y], cues:[{t, s, tx, ty, rate, spring}]}  (s = scale at t; rate = extra scale per second after t)
K.register('punch-in', {
  needs: ['subject', 'clean'], doc: 'hard-cut punch-ins about the head with a slow push; writes the footage transform',
  create(stage, o) {
    const piv = o.pivot || [540, 800], cues = o.cues.slice().sort((a, b) => a.t - b.t);
    return { seek(t) {
      let i = -1; for (let k = 0; k < cues.length; k++) if (t >= cues[k].t) i = k; const c = cues[Math.max(0, i)];
      let s = c.s + (c.rate || 0) * Math.max(0, t - c.t), tx = c.tx || 0, ty = c.ty || 0;
      if (c.spring && i > 0) { const p = cues[i - 1], e = K.sp(t, c.t, K.P.BOX); s = K.lerp(p.s + (p.rate || 0) * (c.t - p.t), s, e); tx = K.lerp(p.tx || 0, tx, e); ty = K.lerp(p.ty || 0, ty, e); }
      K.foot.set('punch', { s, ox: piv[0], oy: piv[1], tx, ty }); } };
  },
});
