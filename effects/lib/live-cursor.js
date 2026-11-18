// effects/lib/live-cursor.js
// doc: a "Claude" cursor drags a gold selection box (8 handles, live pixel-size tag) onto the person, the person gets a thin white
//   outline from the matte, a pink guide line flashes, and the footage punches in ~1.14x following the box. Trigger: "live cursor"
//   (lands on "cursor"). Needs the person matte for the outline. Source: reel DfnvcS1OdZi 2.17-3.33 s (E03).
//   Contributes SK.frame.world (punch) and SK.frame.shark.filters (outline). Colours: gold #C1A95E, tag #213929, guide #E26A74.
K.register('live-cursor', {
  needs: ['subject'],
  doc: 'Claude cursor drags a selection box onto the person, outline + punch-in',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 2.20, drag: 2.30, end: 3.30, sx: 150, sy: 430, tx: 800, ty: 1290, guide: [2.78, 2.98], punch: 0.14, shift: -70 }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', L);
    const box = SK.el('div', `left:0;top:0;border:3px solid #C1A95E;box-sizing:border-box;background:rgba(193,169,94,.07)`, root);
    const hs = Array.from({ length: 8 }, () => SK.el('div', 'width:16px;height:16px;margin:-8px 0 0 -8px;background:#fff;border:2.5px solid #C1A95E;box-sizing:border-box', root));
    const lab = SK.el('div', `height:40px;padding:0 16px;border-radius:7px;background:#C1A95E;color:#200900;font:700 22px/40px ${F.mono};white-space:nowrap`, root, '');
    const gv = SK.el('div', 'top:0;width:2px;height:1920px;background:#E26A74;opacity:.85', root), gh = SK.el('div', 'left:0;height:2px;width:1080px;background:#E26A74;opacity:.6', root);
    const cur = SK.el('div', 'left:0;top:0', root, '<svg width="46" height="60" viewBox="0 0 23 30" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))"><path d="M2 1 L2 22 L7 17 L11 27 L15 25 L11 16 L18 16Z" fill="#fff" stroke="#222" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    const tag = SK.el('div', `left:0;top:0;height:46px;padding:0 20px;border-radius:12px;background:#213929;border:1.5px solid #CCE0D2;color:#F3FEF4;font:600 25px/43px ${F.ui};white-space:nowrap`, root, 'Claude');
    return { seek(t) {
      const live = t >= o.t0 && t < o.end + .05; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const d = K.sp(t, o.drag, [150, 20]), w = Math.sin(t * 17) * 7 * K.clamp(d), h = Math.cos(t * 13) * 9 * K.clamp(d);
      const ent = K.step(t - o.t0, 260, 24);   // cursor flies in from the top-left to the start point
      let cx, cy; if (t < o.drag) { cx = 60 + (o.sx - 60) * K.clamp(ent, 0, 1.04); cy = 230 + (o.sy - 230) * K.clamp(ent, 0, 1.04); } else { cx = o.sx + (o.tx - o.sx) * K.clamp(d, 0, 1.06) + w; cy = o.sy + (o.ty - o.sy) * K.clamp(d, 0, 1.06) + h; }
      const x0 = o.sx, y0 = o.sy, bw = Math.max(0, cx - x0), bh = Math.max(0, cy - y0);
      box.style.left = x0 + 'px'; box.style.top = y0 + 'px'; box.style.width = bw + 'px'; box.style.height = bh + 'px'; box.style.opacity = t >= o.drag ? 1 : 0;
      const pts = [[x0, y0], [x0 + bw / 2, y0], [x0 + bw, y0], [x0 + bw, y0 + bh / 2], [x0 + bw, y0 + bh], [x0 + bw / 2, y0 + bh], [x0, y0 + bh], [x0, y0 + bh / 2]];
      hs.forEach((e, i) => { e.style.left = pts[i][0] + 'px'; e.style.top = pts[i][1] + 'px'; e.style.opacity = t >= o.drag + .03 ? 1 : 0; });
      lab.style.left = x0 + 'px'; lab.style.top = (y0 - 58) + 'px'; lab.innerHTML = `${Math.round(bw * .78)} &times; ${Math.round(bh * .9)}`; lab.style.opacity = t >= o.drag + .03 ? 1 : 0;
      cur.style.left = cx - 4 + 'px'; cur.style.top = cy - 4 + 'px'; tag.style.left = cx + 34 + 'px'; tag.style.top = cy + 40 + 'px';
      const g = t >= o.guide[0] && t < o.guide[1]; gv.style.display = gh.style.display = g ? 'block' : 'none'; gv.style.left = x0 + 'px'; gh.style.top = y0 + 'px';
      // punch-in follows the box; outline on the person
      const k = K.clamp(K.sp(t, o.drag, K.P.BOX)) * (1 - K.clamp(K.sp(t, o.end - .03, K.P.OUT))); const W = SK.frame.world;
      W.s *= 1 + o.punch * k; W.x += o.shift * k; if (t >= o.drag && t < o.end) SK.frame.shark.filters.push('drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)');
    } };
  },
});
