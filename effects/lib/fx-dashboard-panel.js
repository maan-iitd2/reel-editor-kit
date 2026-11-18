// effects/lib/fx-dashboard-panel.js
// doc: the right-side "IN THIS VIDEO nn / 20" list. A white pill springs to the row of the effect being shown; finished rows
//   are bright, upcoming rows muted; "+ 50 more effects" turns gold at opts.goldAt. Hidden during opts.hide intervals.
//   opts.fx = [{name, t, num}] (num null -> "+" bonus row, counter keeps the previous number). Source: reel DfnvcS1OdZi (G3), #183727 panel.
//   Panel x 750-1068, y 224-1128 (touches the IG right zone on purpose, as in the source). el = wrapper (layer-explode may borrow it).
K.register('fx-dashboard-panel', {
  needs: [],
  doc: 'FX dashboard panel with moving white pill, counter, gold badge',
  create(stage, opts) {
    const P = SK.PAL, F = SK.FONT, L = SK.layer(stage, opts, 'top');
    const o = Object.assign({ goldAt: 13.10, hide: [[24.0, 25.7]], appear: 0.93 }, opts);
    const fx = o.fx, N = fx.length, ROW0 = 79, PITCH = 36;
    const wrap = SK.el('div', 'left:0;top:0;width:1080px;height:1920px;pointer-events:none', L);
    const pan = SK.el('div', `left:750px;top:224px;width:318px;height:905px;box-sizing:border-box;border-radius:18px;background:${P.panel};border:1.5px solid ${P.rim};box-shadow:0 14px 40px rgba(0,0,0,.35)`, wrap);
    SK.el('div', `left:27px;top:20px;font:500 16px/22px ${F.mono};letter-spacing:.2em;color:${P.olive}`, pan, 'IN THIS VIDEO');
    const cnt = SK.el('div', `right:27px;top:20px;font:700 16px/22px ${F.mono};color:#F3FEF4;letter-spacing:.04em`, pan, '01 / 20');
    const pill = SK.el('div', `left:10px;top:0;width:297px;height:34px;border-radius:17px;background:${P.pill}`, pan);
    const rows = fx.map((r, i) => { const d = SK.el('div', `left:0;top:${ROW0 + i * PITCH - 17}px;width:318px;height:34px`, pan);
      const n = SK.el('div', `left:27px;top:0;font:500 13px/34px ${F.mono};color:${P.num}`, d, r.num == null ? '+' : String(r.num).padStart(2, '0'));
      const l = SK.el('div', `left:55px;top:0;font:600 24px/34px ${F.ui};white-space:nowrap;letter-spacing:-.01em`, d, r.name); return { d, n, l }; });
    SK.el('div', `left:27px;top:835px;width:264px;height:1.5px;background:${P.rim}`, pan);
    const badge = SK.el('div', `left:13px;top:850px;width:242px;height:42px;border-radius:12px;background:${P.gold}`, pan);
    const btxt = SK.el('div', `left:27px;top:850px;font:600 25px/42px ${F.ui};white-space:nowrap;letter-spacing:-.01em`, pan, '+ 50 more effects');
    let lastNum = 1;
    const cues = [{ t: -9, v: ROW0 }]; fx.forEach((r, i) => { if (i > 0) cues.push({ t: r.t, v: ROW0 + i * PITCH }); });
    return { el: wrap, panel: pan, seek(t) {
      let act = -1; for (let i = 0; i < N; i++) if (t >= fx[i].t) act = i;
      const y = K.springTo(t, cues, [420, 34]);
      const vis = t >= o.appear && !o.hide.some(h => t >= h[0] && t < h[1]);
      wrap.style.visibility = vis || o.alwaysMount ? 'visible' : 'hidden'; if (!vis && !o.alwaysMount) return;
      pill.style.opacity = act >= 0 ? 1 : 0; pill.style.top = (y - 17) + 'px';
      rows.forEach((r, i) => { const on = i === act, done = i < act; r.l.style.color = on ? '#000200' : done ? P.done : P.up; r.n.style.color = on ? '#6B7A6B' : P.num; });
      if (act >= 0 && fx[act].num != null) lastNum = fx[act].num; cnt.textContent = String(lastNum).padStart(2, '0') + ' / 20';
      const g = SK.ramp(t, o.goldAt, o.goldAt + .1); badge.style.opacity = g; btxt.style.color = g > .5 ? '#0B0200' : P.done;
    } };
  },
});
