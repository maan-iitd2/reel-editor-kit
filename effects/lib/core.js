// Shared engine for seek(t) films (motion-design skill rules). Classic script; exposes window.K.
// Rules: everything is computed from t inside seek(t); no CSS transitions, no timers, no Math.random.
(function () {
  function step(t, k, d) { if (t <= 0) return 0; const w = Math.sqrt(k), z = d / (2 * w);
    if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = { UI: [320, 30], BOX: [170, 26], HEAVY: [120, 24], OUT: [400, 40] };   // spring presets (stiffness, damping)

  const K = {
    step, mulberry32, clamp, P,
    lerp: (a, b, k) => a + (b - a) * k,
    // 0 -> ~1 spring starting at time a
    sp: (t, a, p = P.BOX) => step(t - a, p[0], p[1]),
    // in at a (spring p), out at b (snappy). Returns 0..~1.05 (small overshoot allowed)
    vis: (t, a, b, p = P.BOX, out = P.OUT) => Math.max(0, step(t - a, p[0], p[1]) * (1 - step(t - b, out[0], out[1]))),
    // value with many targets: cues [{t, v}] -> sum of one spring per change
    springTo(t, cues, p = P.BOX) { let v = cues.length ? cues[0].v : 0;
      for (let i = 1; i < cues.length; i++) v += (cues[i].v - cues[i - 1].v) * step(t - cues[i].t, p[0], p[1]); return v; },
    // first word whose letters start with `w` at or after `after` seconds -> its start time
    wordT(words, w, after = 0) { const n = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hit = words.find(x => (x.t ?? x.start) >= after && n(x.w ?? x.word).startsWith(n(w))); return hit ? (hit.t ?? hit.start) : null; },

    // Image-sequence plate (e.g. the shark RGBA frames). show(t) swaps the frame and waits for decode.
    Plate: class { constructor(img, pattern, count, fps = 30) { Object.assign(this, { img, pattern, count, fps, i: -1 }); }
      async show(t) { const i = Math.min(this.count - 1, Math.max(0, Math.round(t * this.fps)));
        if (i !== this.i) { this.i = i; this.img.src = this.pattern.replace('%05d', String(i).padStart(5, '0')); await this.img.decode(); } return i; } },

    // Effect registry. Each effect file calls K.register(name, {create(stage, opts) {return {seek(t) {...}}}, needs: [...], doc: '...'})
    fx: {},
    register(name, def) { K.fx[name] = def; },
    make(name, stage, opts = {}) { if (!K.fx[name]) throw new Error('unknown effect ' + name); return K.fx[name].create(stage, opts); },
  };
  window.K = K;
})();
