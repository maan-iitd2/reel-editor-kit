// type-behind-head: giant type that sits between the room and the shark, so head and fin occlude it, and (option, default ON) turns brand green
// wherever it crosses the shark (the matte overlap seen in justyn.ai's hook). Items: 'type' (modes typed | push | letters), 'pair' (italic Claude + gold did.),
// 'timecode' (running HH:MM:SS:FF label). Trigger: the spoken word the type shows (visual lands 0.1-0.3 s after the word starts).
// Source: justyn.ai DfbHxfMNsOr FEATURES F1 (hook stack), F2 ("Claude did."), F14 (HUGE), F19 (NEVER), S5 (matte + green overlap).
// opts: {layers:{under,over}, shark:<img of the shark plate>, items:[...], greenOverlap:true, tint:'#1A2F28'}
K.register('type-behind-head', {
  needs: ['subject'], doc: 'big type behind the head; green where it crosses the shark; typed / slot-push / per-letter / italic pair / timecode',
  create(stage, o) {
    const { P, F } = K.kit, L = o.layers, items = o.items, green = o.greenOverlap !== false, tint = o.tint || '#1A2F28';
    const mk = parent => { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; c.style.cssText = 'position:absolute;inset:0;width:1080px;height:1920px'; parent.appendChild(c); return c; };
    const cu = mk(L.under), co = green ? mk(L.over) : null, xu = cu.getContext('2d'), xo = co && co.getContext('2d');
    const fam = { disp: F.disp, grot: F.grot, ital: F.disp, didone: F.didone };
    const fnt = (it, px) => `${it.font === 'ital' ? 'italic ' : ''}${it.font === 'didone' || it.font === 'grot' ? '700 ' : '400 '}${px}px ${fam[it.font]}`;
    const setf = (ctx, it, px) => { ctx.font = fnt(it, px); ctx.letterSpacing = (it.track || 0) * px + 'px'; };
    const wid = (ctx, it, s, px) => { setf(ctx, it, px); return ctx.measureText(s).width; };
    // draw s with its left edge at x, baseline y, scaled by sc about the text centre
    const put = (ctx, it, s, x, y, px, fill, alpha, sc) => { const w = wid(ctx, it, s, px);
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha)); ctx.translate(x + w / 2, y); ctx.scale(sc, sc); setf(ctx, it, px);
      ctx.fillStyle = fill; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, -w / 2, 0); ctx.restore(); };

    function draw(ctx, t, tintOnly) {
      ctx.clearRect(0, 0, 1080, 1920);
      const col = c => tintOnly ? tint : c;
      for (const it of items) {
        if (t < it.t0 - 1e-6 || t >= it.t1) continue;
        if (it.kind === 'timecode') { const f = Math.floor(t * 30 + 1e-6), pd = n => String(n).padStart(2, '0'), s = `00:00:${pd(Math.floor(f / 30))}:${pd(f % 30)}`;
          it.font = 'mono'; ctx.save(); ctx.font = `500 ${it.size || 30}px ${F.mono}`; ctx.letterSpacing = '4px'; const w = ctx.measureText(s).width;
          ctx.fillStyle = col('rgba(241,232,220,.78)'); ctx.fillText(s, 540 - w / 2, it.y); ctx.restore(); continue; }
        if (it.kind === 'pair') {
          const vis = it.words.filter(w => t >= w.t0); if (!vis.length) continue;
          const wt = wid(ctx, it, vis.map(w => w.text).join(' '), it.size); let x = 540 - wt / 2;
          vis.forEach((w, i) => { const part = (i ? ' ' : '') + w.text, ww = wid(ctx, it, part, it.size), e = K.sp(t, w.t0, K.P.UI);
            const sp = i ? wid(ctx, it, ' ', it.size) : 0;
            put(ctx, it, w.text, x + sp, it.y + (1 - Math.min(1, e)) * 30, it.size, col(w.color === 'gold' ? P.gold : P.cream), e * 1.6, 1 + 0.1 * (1 - Math.min(1, e))); x += ww; });
          continue; }
        const age = t - it.t0; let txt = it.text, px = it.size, y = it.y, a = 1, sc = 1;
        if (it.mode === 'typed') { const n = Math.min(txt.length, Math.floor(age / (it.gap || 0.045)) + 1); txt = txt.slice(0, n);
          const w = wid(ctx, it, txt, px); if (w > it.maxW) px *= it.maxW / w; sc = 1 + (it.pop == null ? 0.22 : it.pop) * (1 - K.clamp(K.sp(t, it.t0, K.P.UI))); }
        else if (it.mode === 'letters') { const n = K.kit.letters(t, it.t0, it.gap || 0.05, txt.length); const w = wid(ctx, it, txt, px); if (w > it.maxW) px *= it.maxW / w;
          const full = wid(ctx, it, txt, px), x0 = 540 - full / 2, pre = txt.slice(0, n);
          // per-letter reveal in place: draw the prefix with its left edge fixed so letters appear left to right
          put(ctx, it, pre, x0, y, px, col(it.color || P.cream), 1, 1); continue; }
        else if (it.mode === 'push') { const w = wid(ctx, it, txt, px); if (w > it.maxW) px *= it.maxW / w;
          const e = K.sp(t, it.t0, [520, 36]), x = K.sp(t, it.t1 - 0.12, [520, 36]); y += (1 - e) * 150 - x * 150; a = K.clamp(e * 1.5) * (1 - K.clamp(x * 1.3)); }
        if (!txt.length) continue;
        const w = wid(ctx, it, txt, px); put(ctx, it, txt, 540 - w / 2, y, px, col(it.color || P.cream), a, sc);
      }
    }

    return { seek(t) {
      draw(xu, t, false);
      if (co) { draw(xo, t, true); xo.save(); xo.globalCompositeOperation = 'destination-in'; const M = K.foot.M; xo.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
        xo.drawImage(o.shark, 0, 0, 1080, 1920); xo.restore(); } } };
  },
});
