// effects/lib/showcase-kit.js: shared helpers for the FX-showcase modules (reel DfnvcS1OdZi). Load after core.js.
// doc: palette measured from the reel (panel #183727, cream #F0ECE0, gold #BEA85D), font stacks, DOM helpers, and the
//   per-frame "contribution" registry that lets several effects act on the same layer without knowing each other:
//   SK.frame.room  {scale, ox, oy, blur, wave}  -> background plate (dolly zoom, rack focus, shockwave)
//   SK.frame.world {s, x, y}                    -> whole footage layer (live-cursor punch)
//   SK.frame.shark {filters[], alpha}           -> the person layer (outline, blow-away hide)
//   The film calls SK.reset() at the start of each seek, then every module's seek(t), then applies SK.frame.
// Layers: a film passes opts.L = {room, behind, shark, front, top, cut}; every module mounts through SK.layer(stage, opts, 'name').
(function () {
  const SK = window.SK = {};
  SK.PAL = { panel: '#183727', rim: '#38543F', cream: '#F0ECE0', ink: '#17311E', gold: '#BEA85D', gold2: '#C1A95E', olive: '#9EAA83',
    num: '#92A383', done: '#F3FEF4', up: '#9BB4A4', pill: '#FDFFFE', dark: '#0C1414', green2: '#1B3B2B', paper: '#EFE8D6', white: '#FFFFFF',
    maroon: '#7A2E3A', red: '#C0524F', callGreen: '#36BB52', callRed: '#BA6064' };
  SK.FONT = { serif: "'Instrument Serif','Playfair Display',Georgia,serif", ui: "Inter,'Segoe UI',Arial,sans-serif",
    mono: "'JetBrains Mono',Consolas,monospace", news: "'Bodoni MT Condensed','Bodoni MT',Georgia,serif",
    body: "'EB Garamond',Georgia,serif", type: "'Courier New',Courier,monospace", black: "'Arial Black',Inter,sans-serif" };

  // el('div', 'left:10px;top:5px', parent, 'html') -> positioned absolute element
  SK.el = (tag, css, parent, html) => { const e = document.createElement(tag); e.style.cssText = 'position:absolute;' + (css || '');
    if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  SK.layer = (stage, opts, name) => (opts && opts.L && opts.L[name]) || stage;
  SK.ramp = (t, a, b) => b === a ? (t >= a ? 1 : 0) : K.clamp((t - a) / (b - a));
  SK.sm = (x) => { x = K.clamp(x); return x * x * (3 - 2 * x); };
  SK.ease = (x) => { x = K.clamp(x); return 1 - Math.pow(1 - x, 3); };
  SK.tc = (frames) => { const f = frames % 30, s = Math.floor(frames / 30) % 60, m = Math.floor(frames / 1800) % 60, h = Math.floor(frames / 108000);
    return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':'); };
  SK.px = v => (Math.round(v * 100) / 100) + 'px';

  // per-seek contribution registry
  SK.reset = () => { SK.frame = { room: { scale: 1, ox: 540, oy: 760, blur: 0, wave: null }, world: { s: 1, x: 0, y: 0 }, shark: { filters: [], alpha: 1 }, grade: {} }; };
  SK.reset();
  // circle-shaped footage mask helper: draws the current footage composite into a canvas ctx
  SK.paintFoot = (opts, ctx, w, h) => { if (opts && opts.foot) opts.foot.paint(ctx, w, h); };
})();
