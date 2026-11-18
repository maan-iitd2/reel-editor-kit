// effects/lib/code-body.js
// doc: a scan line sweeps down and the frame becomes code: dark-green scrolling source text with the person re-drawn live as a figure of
//   mono characters (head/face cream, body maroon); glyphs start big and resolve small, then a scan line takes it away.
//   Trigger: "code body". Needs the person matte (the figure is sampled from the person plate). Layer: full-frame cut-away under the dashboard.
//   Source: reel DfnvcS1OdZi 8.27-9.40 s (E08). Background #0C1C14, code #2A4A38, face #F0EEDA, body #7A2E3A.
K.register('code-body', {
  needs: ['subject'],
  doc: 'person re-rendered as ASCII characters over scrolling code, with scan-line in/out',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 8.27, scan: 0.12, res0: 8.40, res1: 8.85, out: 9.27, end: 9.40 }, opts);
    const cv = SK.el('canvas', 'left:0;top:0;width:1080px;height:1920px', L); cv.width = 1080; cv.height = 1920; const g = cv.getContext('2d');
    const src = document.createElement('canvas'), sg = src.getContext('2d', { willReadFrequently: true });
    const code = ['import json, pathlib, subprocess', 'from effects import REGISTRY', '', 'STYLE = "shark"; GRADE = "warm-dark"', 'FX = ["layer-explode", "word-stamp", "live-cursor", "title-card-dive",', '      "orbit-ring", "dolly-zoom", "storyboard-deck", "code-body",', '      "blow-away", "comment-drop", "shockwave", "screenplay-page"]', '', 'def beats(words):', '    out = []', '    for w in words:', '        t = round(w["start"] + LEAD.get(w["word"], 0.3), 3)', '        out.append({"t": t, "fx": REGISTRY[w["word"]], "dur": 1.2})', '    return sorted(out, key=lambda b: b["t"])', '', 'CTA = {"word": "EDIT", "line": "to get access to these + 50 more effects"}', 'PEAK = {"simple-whoosh": 0.62, "deep-short-whoosh": 0.47, "tick": 0.21}', '', 'def render(film, audio, chunks=3, sub=2):', '    frames = [seek(i / 30) for i in range(int(T * 30))]', '    return mux(frames, audio, crf=16)', '', 'HOOK = None; END_CARD = []; CARDS = []; BEHIND = [-1]', 'work/beats.json  ->  out/timeline.mp4   # comment EDIT'];
    return { seek(t) {
      const live = t >= o.t0 && t < o.end; cv.style.display = live ? 'block' : 'none'; if (!live) return;
      const inK = SK.ease((t - o.t0) / o.scan), outK = SK.ease((t - o.out) / (o.end - o.out)); const edge = 1920 * inK * (1 - outK);
      g.clearRect(0, 0, 1080, 1920); g.save(); g.beginPath(); g.rect(0, 0, 1080, outK > 0 ? 1920 * (1 - outK) : edge); g.clip();
      g.fillStyle = '#0C1C14'; g.fillRect(0, 0, 1080, 1920); g.font = `500 25px ${F.mono}`; g.fillStyle = '#2E5240'; g.textBaseline = 'top';
      const sc = (t - o.t0) * 70; for (let i = -2; i < 72; i++) { const li = (i + Math.floor(sc / 30)) % code.length; g.fillText(code[(li + code.length) % code.length].repeat(2), -40 + (i % 3) * 6, i * 30 - sc % 30); }
      // person as characters
      const cw = 8 + 24 * (1 - SK.sm((t - o.res0) / (o.res1 - o.res0))), ch = cw * 1.7, cols = Math.ceil(1080 / cw), rows = Math.ceil(1920 / ch);
      src.width = cols; src.height = rows; sg.clearRect(0, 0, cols, rows); sg.drawImage(opts.sharkEl, 0, 0, cols, rows); const d = sg.getImageData(0, 0, cols, rows).data;
      g.font = `700 ${Math.round(ch * 1.05)}px ${F.mono}`; g.textBaseline = 'top'; const ramp = '.:-=+*#%@01', hy = 900;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = (r * cols + c) * 4, a = d[i + 3]; if (a < 90) continue;
        const lum = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, y = r * ch, head = y < hy && y > 440;
        const k = Math.min(ramp.length - 1, Math.floor((head ? lum * 1.2 : lum * 1.8 + .2) * ramp.length)); const L1 = head ? 150 + lum * 105 : 70 + lum * 120;
        g.fillStyle = head ? 'rgba(235,228,200,.28)' : 'rgba(122,46,58,.62)'; g.fillRect(c * cw, y, cw + .5, ch + .5);
        g.fillStyle = head ? `rgb(${L1 | 0},${(L1 * .98) | 0},${(L1 * .86) | 0})` : `rgb(${(L1 * 1.25) | 0},${(L1 * .45) | 0},${(L1 * .5) | 0})`; g.fillText(ramp[k], c * cw, y); }
      g.restore(); const ly = outK > 0 ? 1920 * (1 - outK) : edge; if (ly > 2 && ly < 1918) { g.fillStyle = '#F0EEDA'; g.fillRect(0, ly - 2, 1080, 4); }
    } };
  },
});
