// nle-timeline: a dark video-editor timeline panel (T1 captions, V3/V2 effect clips, V1 thumbnails, A1-A3 waveforms) revealed by a pink playhead that sweeps
// left to right while a gold timecode runs, then the panel squashes to a thin white line (which the next card grows out of).
// Trigger: "I know nothing about video editing/animation". Source: justyn.ai DfbHxfMNsOr FEATURES F8 (panel 1062x441 of 1276, 6 tracks, timecode 00:00:52:10).
// opts: {t0,t1,sweep:[a,b], y:300, total:52.33}  (data is deterministic: K.mulberry32)
K.register('nle-timeline', {
  needs: [], doc: 'NLE timeline panel: playhead sweep reveals clips and waveforms, running timecode, squash to a line',
  create(stage, o) {
    const { P, F, el } = K.kit, X = 60, Y = o.y || 330, W = 900, H = 620, TX = 170, TW = 760, rnd = K.mulberry32(7);
    const host = el('div', 'position:absolute;inset:0', o.layer || stage);
    const pan = el('div', `position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:${H}px;border-radius:22px;background:#0F1A17;box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden;transform-origin:50% 50%`, host);
    el('div', `position:absolute;left:28px;top:22px;font:600 28px ${F.ui};color:#e9eee8`, pan, 'Timeline');
    const tc = el('div', `position:absolute;left:0;right:0;top:20px;text-align:center;font:500 34px ${F.mono};color:${P.gold};letter-spacing:.04em`, pan);
    el('div', `position:absolute;left:${TX}px;right:30px;top:78px;height:2px;background:rgba(255,255,255,.12)`, pan);
    [0, 10, 20, 30, 40, 50].forEach(s => el('div', `position:absolute;left:${TX + s / 52.33 * TW - 2}px;top:62px;font:500 16px ${F.mono};color:rgba(255,255,255,.45)`, pan, '0:' + String(s).padStart(2, '0')));
    const tracks = [['T1', 100], ['V3', 188], ['V2', 276], ['V1', 364], ['A1', 452], ['A2', 520], ['A3', 580]], rows = {};
    const bodyH = { T1: 56, V3: 56, V2: 56, V1: 62, A1: 56, A2: 44, A3: 36 };
    const clip = el('div', `position:absolute;left:${TX}px;top:0;width:${TW}px;height:${H}px;clip-path:inset(0 100% 0 0)`, pan);
    tracks.forEach(([n, y]) => { el('div', `position:absolute;left:18px;top:${y}px;width:84px;height:${bodyH[n]}px;border-radius:12px;background:rgba(255,255,255,.07);font:600 20px/${bodyH[n]}px ${F.mono};color:rgba(255,255,255,.7);text-align:center`, pan, n);
      rows[n] = y; });
    // T1 pink blocks, V3 gold, V2 cream, V1 thumbs, waveforms
    let x = 0; while (x < TW - 10) { const w = 10 + rnd() * 34; el('div', `position:absolute;left:${x}px;top:${rows.T1}px;width:${w}px;height:56px;border-radius:5px;background:${P.tpink}`, clip); x += w + 4 + rnd() * 5; }
    [[0, 70, 'fx01'], [250, 60, 'fx06'], [400, 90, 'fx09'], [520, 120, 'fxmoody']].forEach(([l, w, n]) => el('div', `position:absolute;left:${l}px;top:${rows.V3}px;width:${w}px;height:56px;border-radius:6px;background:${P.gold};font:500 15px/20px ${F.mono};color:#3b2f10;padding:4px 6px;box-sizing:border-box`, clip, n));
    [[40, 90, 'fx02'], [160, 110, 'fx03'], [330, 70, 'fx08'], [470, 90, 'fx14'], [590, 80, 'fx15'], [690, 70, 'fx17']].forEach(([l, w, n]) => el('div', `position:absolute;left:${l}px;top:${rows.V2}px;width:${w}px;height:56px;border-radius:6px;background:${P.cream};font:500 15px/20px ${F.mono};color:#222;padding:4px 6px;box-sizing:border-box`, clip, n));
    for (let i = 0; i < 12; i++) el('div', `position:absolute;left:${i * (TW / 12)}px;top:${rows.V1}px;width:${TW / 12 - 3}px;height:62px;border-radius:5px;background:linear-gradient(160deg,#58707a,#2a3b44)`, clip).innerHTML = `<div style="margin:10px auto;width:22px;height:34px;border-radius:50% 50% 6px 6px;background:#b8ccd4"></div>`;
    const wave = (y, h, col, gaps) => { for (let i = 0; i < TW; i += 6) { if (gaps && i > gaps[0] && i < gaps[1]) continue; const a = (0.25 + rnd() * 0.75) * h; el('div', `position:absolute;left:${i}px;top:${y + (h - a) / 2}px;width:3px;height:${a}px;border-radius:2px;background:${col}`, clip); } };
    wave(rows.A1, 56, '#86978a'); wave(rows.A2, 44, P.gold, [330, 370]); for (let i = 0; i < 9; i++) el('div', `position:absolute;left:${i * 16}px;top:${rows.A3 + 4}px;width:9px;height:${28 - i * 2}px;background:#e9eee8;border-radius:2px`, clip);
    const ph = el('div', `position:absolute;left:${TX}px;top:56px;width:3px;height:${H - 56}px;background:${P.tpink}`, pan); el('div', `position:absolute;left:-9px;top:-4px;width:0;height:0;border:10px solid transparent;border-top:14px solid ${P.tpink}`, ph);
    return { seek(t) {
      const on = t >= o.t0 - 0.02 && t < o.t1 + 0.05; host.style.display = on ? 'block' : 'none'; if (!on) return;
      const p = K.clamp((t - o.sweep[0]) / (o.sweep[1] - o.sweep[0])), pe = p * p * (3 - 2 * p) * .5 + p * .5, e = K.sp(t, o.t0, K.P.BOX), sq = K.sp(t, o.t1 - 0.08, [500, 40]);
      clip.style.clipPath = `inset(0 ${(1 - pe) * 100}% 0 0)`; ph.style.left = (TX + pe * TW) + 'px'; ph.style.opacity = p > 0 && p < 1.001 ? 1 : 0;
      const s = o.total * pe, f = Math.floor(s * 30), pd = n => String(n).padStart(2, '0'); tc.textContent = `00:00:${pd(Math.floor(s))}:${pd(f % 30)}`;
      pan.style.opacity = K.clamp(e * 2) * (1 - K.clamp((sq - .8) * 5)); pan.style.transform = `translateY(${(1 - e) * 60}px) scaleY(${1 - 0.99 * sq}) scaleX(${1 + 0.08 * sq})`; } }; },
});
