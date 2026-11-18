// effects/lib/blow-away.js
// doc: the person disintegrates into thousands of particles in their own colours that blow off to the right (feet first, head last),
//   the clean-plate room (empty chair) holds for a beat, then the particles drift back and re-form (head first).
//   Trigger: "blow away" (starts just after "away"). Needs the person matte as pixels (opts.sharkEl) and a clean plate behind.
//   Hides the real person plate via SK.frame.shark.alpha while particles are live. Source: reel DfnvcS1OdZi 9.70-10.60 s (E09):
//   dissolve 9.70-10.07, clean plate 10.07-10.27, re-form 10.27-10.60.
K.register('blow-away', {
  needs: ['clean', 'subject'],
  doc: 'person -> particles blow right, clean room holds, particles re-form',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front');
    const o = Object.assign({ t0: 9.70, d1: 10.07, r0: 10.27, t1: 10.60, stride: 3 }, opts), W = 1080, H = 1920;
    const cv = SK.el('canvas', 'left:0;top:0;width:1080px;height:1920px', L); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const src = document.createElement('canvas'); src.width = W; src.height = H; const sg = src.getContext('2d', { willReadFrequently: true });
    const rnd = K.mulberry32(77), gw = Math.ceil(W / o.stride), gh = Math.ceil(H / o.stride), n = gw * gh, R = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) R[i] = rnd();
    const out = g.createImageData(W, H); const od = out.data;
    return { seek(t) {
      const live = t >= o.t0 && t < o.t1 + .02; cv.style.display = live ? 'block' : 'none'; if (!live) return;
      SK.frame.shark.alpha = 0;
      const hold = t >= o.d1 && t < o.r0; if (hold) { g.clearRect(0, 0, W, H); return; }
      sg.clearRect(0, 0, W, H); sg.drawImage(opts.sharkEl, 0, 0, W, H); const d = sg.getImageData(0, 0, W, H).data; od.fill(0);
      const re = t >= o.r0, T = o.d1 - o.t0, s = o.stride, jit = 1;
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { const x = gx * s, y = gy * s, si = (y * W + x) * 4, a = d[si + 3]; if (a < 40) continue;
        const k = gy * gw + gx, r1 = R[k * 3], r2 = R[k * 3 + 1], r3 = R[k * 3 + 2], yn = y / H, xn = x / W;
        let p; if (!re) p = K.clamp((t - o.t0 - (.2 * ((1 - yn) * .78 + xn * .22) + r1 * .05)) / .16); else p = 1 - K.clamp((t - o.r0 - (.2 * yn * .8 + r1 * .05)) / .12);
        if (p <= 0.001) { /* in place */ } const e = p * p, dx = (200 + r2 * 520) * e * (1.2 - .3 * yn), dy = (-60 - r3 * 260) * e + Math.sin(r1 * 40 + t * 9) * 20 * e;
        const al = a / 255 * (1 - Math.pow(p, 1.6)); if (al < .02) continue; const px = (x + dx) | 0, py = (y + dy) | 0, sz = s + (e > .2 ? 0 : 0);
        for (let yy = 0; yy < sz; yy++) { const Y = py + yy; if (Y < 0 || Y >= H) continue; for (let xx = 0; xx < sz; xx++) { const X = px + xx; if (X < 0 || X >= W) continue; const oi = (Y * W + X) * 4; od[oi] = d[si]; od[oi + 1] = d[si + 1]; od[oi + 2] = d[si + 2]; od[oi + 3] = al * 255; } } }
      g.putImageData(out, 0, 0);
      g.globalCompositeOperation = 'source-over'; cv.style.filter = 'brightness(.82) contrast(1.05) sepia(.1)';
    } };
  },
});
