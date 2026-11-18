// effects/lib/screenplay-page.js
// doc: a cream typewriter script page takes the whole frame (the dashboard stays on top): slugline, character cue, parenthetical,
//   the spoken effect names as dialogue, "CUT TO:". A tan highlight sweeps over the current effect name; the page slides in tilted
//   from the bottom and drops out at the end. Trigger: "screenplay page". Source: reel DfnvcS1OdZi 14.50-15.77 s (E12).
K.register('screenplay-page', {
  needs: [],
  doc: 'cream Courier script page with moving highlight, slide in/out',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 14.50, out: 15.67, end: 15.77, hl0: 14.70, hl1: 15.50, who: 'SHARK',
      lines: ['plus 50 more', 'effects. Shockwave.', 'Screenplay page.', 'File drop.'] }, opts);
    const pg = SK.el('div', `left:0;top:0;width:1080px;height:1920px;background:#F0ECE0;overflow:hidden;box-shadow:0 -10px 40px rgba(0,0,0,.4)`, L);
    const ct = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', pg);
    const tx = `font:400 43px/48px ${F.type};color:#1A1A1A;white-space:pre`;
    SK.el('div', `left:45px;top:432px;${tx};font-size:40px;color:#6B6B62`, ct, 'INT. GREEN ROOM - DAY');
    SK.el('div', `left:0;top:524px;width:740px;text-align:center;${tx};font-weight:700`, ct, o.who);
    SK.el('div', `left:0;top:572px;width:740px;text-align:center;${tx}`, ct, '(to camera)');
    const hl = SK.el('div', 'left:92px;top:716px;height:42px;background:#E6D3A0;width:0;border-radius:3px', ct);
    o.lines.forEach((s, i) => SK.el('div', `left:96px;top:${618 + i * 48}px;${tx};color:${i === 2 ? '#1A1A1A' : '#8A8A80'}`, ct, s));
    SK.el('div', `left:0;top:866px;width:700px;text-align:right;${tx};color:#6B6B62;`, ct, 'CUT TO:');
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; pg.style.display = live ? 'block' : 'none'; if (!live) return;
      const inn = K.clamp(K.step(t - o.t0, 300, 30)), ex = SK.sm((t - o.out) / (o.end - o.out));
      pg.style.transform = `translateY(${(1 - inn) * 1920 + ex * 1920}px) rotate(${(1 - inn) * 3}deg)`;
      hl.style.width = (6 + 470 * SK.sm((t - o.hl0) / (o.hl1 - o.hl0))) + 'px'; ct.style.transform = `translateY(${-(t - o.t0) * 14}px)`;
    } };
  },
});
