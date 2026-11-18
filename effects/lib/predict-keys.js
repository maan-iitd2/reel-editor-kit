// effects/lib/predict-keys.js
// doc: an iOS-style keyboard rises from the bottom, types a phrase key by key (magnified key bubble, pressed keycap), the prediction
//   bar offers the word, the chosen word turns gold and the send button goes gold, then the keyboard drops away.
//   Trigger: "predict keys". Source: reel DfnvcS1OdZi 21.80-22.85 s (E18). Block x 33-740, y 1076-1470; cream keys #EDE8DD on #183727.
//   opts: t0, keys [{t, ch}], pick, gold, out, prefix, word
K.register('predict-keys', {
  needs: [],
  doc: 'phone keyboard types a word, prediction bar, gold send button',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'front'), F = SK.FONT;
    const o = Object.assign({ t0: 21.80, keys: [{ t: 22.05, ch: 'k' }, { t: 22.12, ch: 'e' }, { t: 22.20, ch: 'y' }, { t: 22.30, ch: 's' }], pick: 22.40, gold: 22.50, send: 22.60, next: 22.70, out: 22.80, prefix: 'Predict ', word: 'keys' }, opts);
    const root = SK.el('div', 'left:0;top:0;width:1080px;height:1920px', L);
    const bar = SK.el('div', `left:33px;top:1076px;width:707px;height:67px;border-radius:22px;background:#183727;border:1.5px solid #38543F`, root);
    const txt = SK.el('div', `left:26px;top:0;font:600 40px/67px ${F.ui};color:#F3FEF4;white-space:nowrap;letter-spacing:-.01em`, bar, '');
    const send = SK.el('div', 'right:12px;top:8px;width:50px;height:50px;border-radius:50%;background:#F3FEF4', bar, '<svg width="50" height="50" viewBox="0 0 50 50"><path d="M25 38 V14 M14 24 L25 13 L36 24" stroke="#183727" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    const tiles = [33, 272, 510].map((x, i) => SK.el('div', `left:${x}px;top:1148px;width:${i === 1 ? 230 : 233}px;height:52px;border-radius:14px;background:#EDE8DD;color:#183727;font:500 29px/52px ${F.ui};text-align:center`, root, ''));
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], kw = 61.7, kh = 58, keyEl = {};
    const mkKey = (x, y, w, c, label, fn) => SK.el('div', `left:${x}px;top:${y}px;width:${w}px;height:${kh}px;border-radius:12px;background:${fn ? '#233D2A' : '#EDE8DD'};color:${fn ? '#F3FEF4' : '#183727'};font:500 31px/${kh}px ${F.ui};text-align:center;box-shadow:0 2px 0 rgba(0,0,0,.35)`, root, label);
    rows[0].split('').forEach((c, i) => keyEl[c] = mkKey(33 + i * (kw + 10), 1210, kw, c, c));
    rows[1].split('').forEach((c, i) => keyEl[c] = mkKey(64 + i * (kw + 10), 1275, kw, c, c));
    rows[2].split('').forEach((c, i) => keyEl[c] = mkKey(33 + 100 + i * (kw + 10), 1342, kw, c, c));
    mkKey(33, 1342, 90, '', '&#8679;', 1); mkKey(650, 1342, 90, '', '&#9003;', 1);
    mkKey(33, 1410, 100, '', '123', 1); mkKey(143, 1410, 66, '', ','); mkKey(219, 1410, 372, '', 'space'); mkKey(601, 1410, 66, '', '.'); mkKey(677, 1410, 63, '', 'ret', 1);
    const bub = SK.el('div', `width:84px;height:100px;border-radius:18px;background:#F4EFE4;color:#183727;font:500 62px/100px ${F.ui};text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.4)`, root, '');
    return { seek(t) {
      const live = t >= o.t0 && t < o.out + .12; root.style.display = live ? 'block' : 'none'; if (!live) return;
      const inn = K.step(t - o.t0, 320, 30), ex = SK.sm((t - o.out) / .08); root.style.transform = `translateY(${(1 - K.clamp(inn, 0, 1.05)) * 520 + ex * 520}px)`;
      const nTyped = o.keys.filter(k => t >= k.t).length, typed = o.keys.slice(0, nTyped).map(k => k.ch).join(''), picked = t >= o.pick;
      const cur = Math.floor(t * 4) % 2 === 0 ? '|' : '';
      if (t >= o.gold) txt.innerHTML = `${o.prefix}<span style="color:#BEA85D">${o.word}</span>`; else txt.textContent = o.prefix + (picked ? o.word : typed) + (picked ? '' : cur);
      const preds = t >= o.next ? ['', 'post', ''] : nTyped === 0 ? ['the', 'your', 'what'] : nTyped === 1 ? ['k', 'keys', 'keep'] : nTyped === 2 ? ['ke', 'keys', 'kept'] : ['key', 'keys', 'keyboard'];
      tiles.forEach((e, i) => { e.textContent = preds[i]; e.style.background = (picked && i === 1 && t < o.next) ? '#183727' : '#EDE8DD'; e.style.color = (picked && i === 1 && t < o.next) ? '#F3FEF4' : '#183727'; e.style.border = (picked && i === 1 && t < o.next) ? '1.5px solid #BEA85D' : 'none'; });
      send.style.background = t >= o.send ? '#C1A95E' : '#F3FEF4';
      let pressed = null; o.keys.forEach(k => { if (t >= k.t && t < k.t + .08) pressed = k.ch; });
      Object.keys(keyEl).forEach(c => { keyEl[c].style.transform = c === pressed ? 'scale(.93)' : 'none'; });
      if (pressed) { const r = keyEl[pressed], x = parseFloat(r.style.left) - 11, y = parseFloat(r.style.top) - 72; bub.style.display = 'block'; bub.style.left = x + 'px'; bub.style.top = y + 'px'; bub.textContent = pressed; } else bub.style.display = 'none';
    } };
  },
});
