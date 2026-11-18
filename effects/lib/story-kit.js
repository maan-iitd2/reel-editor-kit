// story-kit: shared helpers for the story-reel modules (palette, fonts, DOM, footage state, SVG filters). Not an effect.
// Source: lab/reel-DfbHxfMNsOr/FEATURES.md section 1 (palette and type measured from justyn.ai DfbHxfMNsOr).
// Needs core.js first. Fonts: load <link href=".../.claude/skills/reel-storyboard/fonts.css"> (Instrument Serif, EB Garamond, Inter, JetBrains Mono);
// system fonts used: Arial Black (heavy grotesk), Georgia Bold (magazine masthead).
(function () {
  const P = { green: '#163227', green2: '#1A2E2B', cream: '#F1E8DC', doc: '#F7F0E9', gold: '#C7A259', cap: '#22372C', muted: '#7F9788',
    red: '#D6323B', pink: '#D2646E', pinkBg: '#F3E6DD', tpink: '#C66672', ink: '#0B0B0B', white: '#FFFFFF', black: '#050306', panel: '#0E1816' };
  const F = { disp: "'Instrument Serif','Times New Roman',serif", grot: "'Arial Black','Segoe UI Black',Impact,sans-serif",
    didone: "Georgia,'Times New Roman',serif", ui: "'Inter','Segoe UI',sans-serif", mono: "'JetBrains Mono',Consolas,monospace", gar: "'EB Garamond',Georgia,serif" };

  function el(tag, css, parent, text) {
    const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e); return e; }
  const px = v => Math.round(v * 100) / 100 + 'px';
  const typed = (s, t, t0, cps) => s.slice(0, K.clamp(Math.floor((t - t0) * cps), 0, s.length));
  const mix = (a, b, k) => a + (b - a) * K.clamp(k);
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

  // Ordered layers inside the stage: bg (flat colour for the grid scene) < room < under (type behind head) < shark < over (green overlap) < ui < cap < top
  function layers(stage) {
    const L = {}; ['bg', 'room', 'under', 'shark', 'over', 'ui', 'cap', 'top'].forEach((n, i) =>
      L[n] = el('div', `position:absolute;inset:0;width:1080px;height:1920px;z-index:${i};pointer-events:none`, stage));
    return L; }

  // Footage state: modules call K.foot.set(name, {s, ox, oy, tx, ty, filter}) = scale s about (ox,oy) then translate (tx,ty); filter = CSS filter string.
  // The film calls K.foot.apply() after the footage modules ran; K.foot.M is then the composed 2D matrix [a,b,c,d,e,f] (origin 0 0) so
  // canvases can mask with the same transform as the shark plate (type-behind-head green overlap).
  const foot = { parts: {}, order: [], els: [], M: [1, 0, 0, 1, 0, 0],
    set(name, o) { if (!(name in this.parts)) this.order.push(name); this.parts[name] = o || {}; },
    apply() { let M = [1, 0, 0, 1, 0, 0], fl = '';
      const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
      for (const n of this.order) { const p = this.parts[n]; if (p.s != null) { const s = p.s, ox = p.ox || 0, oy = p.oy || 0;
          M = mul([1, 0, 0, 1, p.tx || 0, p.ty || 0], mul([1, 0, 0, 1, ox, oy], mul([s, 0, 0, s, 0, 0], mul([1, 0, 0, 1, -ox, -oy], M)))); }
        if (p.filter) fl += ' ' + p.filter; }
      this.M = M; const tf = `matrix(${M.map(v => v.toFixed(5)).join(',')})`;
      for (const e of this.els) { e.style.transformOrigin = '0 0'; e.style.transform = tf; e.style.filter = fl.replace(/@G/g, `url(#${e.dataset.g || 'kgradeA'})`).trim(); } } };

  // Hidden SVG with the grade filters (A = main footage, B = clone used during wipes) and the whip blur.
  function svgFilters() {
    if (document.getElementById('kfilters')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.id = 'kfilters'; s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.position = 'absolute';
    const grade = id => `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix id="${id}m" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/>
      <feComponentTransfer id="${id}g"><feFuncR type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="1" offset="0"/></feComponentTransfer></filter>`;
    s.innerHTML = grade('kgradeA') + grade('kgradeB') + `<filter id="kwhip" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur id="kwhipb" stdDeviation="0 0"/></filter>`;
    document.body.appendChild(s); }
  // g = {gain:[r,g,b], sat, bright, gamma}
  function setGrade(id, g) {
    const [gr, gg, gb] = g.gain, b = g.bright, s = g.sat, lr = .2126, lg = .7152, lb = .0722;
    const M = [[(lr + s * (1 - lr)), lg * (1 - s), lb * (1 - s)], [lr * (1 - s), (lg + s * (1 - lg)), lb * (1 - s)], [lr * (1 - s), lg * (1 - s), (lb + s * (1 - lb))]];
    const gs = [gr, gg, gb].map(x => x * b); const v = [];
    for (let i = 0; i < 3; i++) v.push(...M[i].map(x => (x * gs[i]).toFixed(4)), 0);
    v.push(0, 0, 0, 1, 0);
    document.getElementById(id + 'm').setAttribute('values', v.join(' '));
    document.getElementById(id + 'g').querySelectorAll('*').forEach(f => f.setAttribute('exponent', g.gamma.toFixed(4))); }
  function setWhip(sx, sy) { document.getElementById('kwhipb').setAttribute('stdDeviation', `${sx.toFixed(2)} ${sy.toFixed(2)}`); }

  // letter-stagger helper: how many letters of an n-letter word are in at time t, one per `gap` seconds from t0
  const letters = (t, t0, gap, n) => K.clamp(Math.floor((t - t0) / gap) + 1, 0, n);

  K.kit = { P, F, el, px, typed, mix, hex, layers, svgFilters, setGrade, setWhip, letters };
  K.foot = foot;
})();
