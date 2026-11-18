// effects/lib/paper-tear.js
// doc: the full-frame newspaper rips in two along a jagged vertical line; the halves curl and fly apart, with a white torn-fibre edge
//   and a shadow on the footage underneath, revealing the live scene. Trigger: "paper tear" (lands on "tear"). Needs a press-front
//   instance (opts.page) to duplicate. Source: reel DfnvcS1OdZi 25.40-25.75 s (E21). Tear line ~x 560-600, white fibre ~6 px.
K.register('paper-tear', {
  needs: ['full'],
  doc: 'newspaper splits along a jagged tear and the halves fly off',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut');
    const o = Object.assign({ t0: 25.40, end: 25.82, seed: 5 }, opts), W = 1080, H = 1920, rnd = K.mulberry32(o.seed);
    const pts = []; let x = 575; for (let y = 0; y <= H; y += 48) { x += (rnd() - .5) * 46; x = Math.max(520, Math.min(640, x)); pts.push([Math.round(x), y]); }
    const path = pts.map(p => p.join(' ')).join(' L ');
    const mk = (side) => { const wrap = SK.el('div', `left:0;top:0;width:${W}px;height:${H}px;transform-origin:${side < 0 ? '0 100%' : '100% 100%'};filter:drop-shadow(0 0 26px rgba(0,0,0,.55))`, L);
      const inner = SK.el('div', `left:0;top:0;width:${W}px;height:${H}px`, wrap); inner.appendChild(opts.page.copy());
      const poly = side < 0 ? `0px 0px, ${pts.map(p => (p[0] + 3) + 'px ' + p[1] + 'px').join(', ')}, 0px ${H}px` : `${W}px 0px, ${pts.map(p => p[0] + 'px ' + p[1] + 'px').reverse().join(', ')}, ${W}px ${H}px`;
      inner.style.clipPath = `polygon(${poly})`;
      SK.el('div', `left:0;top:0;width:${W}px;height:${H}px`, inner, `<svg width="${W}" height="${H}"><path d="M ${path}" fill="none" stroke="#FFFFFF" stroke-width="${side < 0 ? 7 : 7}" stroke-linejoin="round" opacity=".95"/></svg>`);
      return wrap; };
    const A = mk(-1), B = mk(1);
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; A.style.display = B.style.display = live ? 'block' : 'none'; if (!live) return;
      const p = SK.ease((t - o.t0) / (o.end - o.t0)), q = p * p;
      A.style.transform = `translate(${-W * .62 * q}px,${60 * q}px) rotate(${-14 * q}deg)`; B.style.transform = `translate(${W * .7 * q}px,${-190 * q}px) rotate(${16 * q}deg)`;
    } };
  },
});
