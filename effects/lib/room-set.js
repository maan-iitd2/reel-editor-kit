// effects/lib/room-set.js
// doc: the background layer of a showcase film: the clean-plate room (shark rig `room` layer) graded warm and dark, plus
//   set dressing (picture frame, clock, books, leather chair) so the wall effects have something to act on.
//   Applies SK.frame.room each seek: scale about (ox,oy) [dolly zoom], blur [rack focus], radial wave warp [shockwave].
//   Source: reel DfnvcS1OdZi, G1 base footage + grade (shadow #0C1414, warm tungsten).
K.register('room-set', {
  needs: ['clean'],
  doc: 'graded clean-plate room with picture/clock/books/chair; takes scale, blur and wave contributions from other effects',
  create(stage, opts) {
    const W = 1080, H = 1920, L = SK.layer(stage, opts, 'room');
    const out = SK.el('canvas', 'left:0;top:0;width:1080px;height:1920px;will-change:transform', L); out.width = W; out.height = H;
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    const g = base.getContext('2d');
    g.filter = 'brightness(.50) contrast(1.12) saturate(1.05) sepia(.22)'; g.drawImage(opts.roomImg, 0, 0, W, H); g.filter = 'none';
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    // chair (empty-chair clean plate for blow-away)
    let gr = g.createLinearGradient(330, 1160, 800, 1900); gr.addColorStop(0, '#7A4330'); gr.addColorStop(1, '#3A1E15');
    g.fillStyle = gr; rr(340, 1190, 470, 760, 70); g.fill(); g.fillStyle = 'rgba(255,190,140,.10)'; rr(370, 1215, 130, 700, 60); g.fill();
    g.fillStyle = '#5A3022'; rr(395, 1130, 360, 110, 50); g.fill();
    // picture frame
    g.fillStyle = '#15130E'; g.fillRect(346, 286, 342, 522); g.fillStyle = '#CFC7B2'; g.fillRect(352, 292, 330, 510);
    g.fillStyle = '#B7AE98'; g.fillRect(352, 292, 330, 6);
    gr = g.createLinearGradient(402, 393, 633, 698); gr.addColorStop(0, '#7A6A58'); gr.addColorStop(.5, '#5A4B3E'); gr.addColorStop(1, '#2E251E');
    g.fillStyle = gr; g.fillRect(402, 393, 231, 305);
    g.fillStyle = 'rgba(220,205,180,.35)'; g.beginPath(); g.moveTo(402, 640); g.lineTo(470, 520); g.lineTo(520, 585); g.lineTo(575, 470); g.lineTo(633, 600); g.lineTo(633, 698); g.lineTo(402, 698); g.fill();
    // clock
    g.fillStyle = '#6B4A22'; g.beginPath(); g.arc(975, 1250, 62, 0, 7); g.fill(); g.fillStyle = '#D9CFB0'; g.beginPath(); g.arc(975, 1250, 50, 0, 7); g.fill();
    g.strokeStyle = '#2a2018'; g.lineWidth = 3; g.beginPath(); g.moveTo(975, 1250); g.lineTo(975, 1218); g.moveTo(975, 1250); g.lineTo(995, 1262); g.stroke();
    // books + shelf
    g.fillStyle = '#1B120C'; g.fillRect(820, 1385, 260, 24);
    [['#8A1F22', 880, 1335, 200, 50], ['#1F4A33', 860, 1300, 190, 36]].forEach(([c, x, y, w, h]) => { g.fillStyle = c; g.fillRect(x, y + 50 - h + 0, w, h); g.fillStyle = '#C9B26A'; g.fillRect(x + 14, y + 50 - h + 12, 70, 5); });
    // lamp bloom + vignette
    let v = g.createRadialGradient(540, 900, 300, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const c2 = out.getContext('2d'), src = g.getImageData(0, 0, W, H), dst = c2.createImageData(W, H);
    let lastKey = '';
    return { base, seek(t) {
      const R = SK.frame.room, w = R.wave; const key = [R.scale.toFixed(4), R.blur.toFixed(2), w ? [w.cx, w.cy, w.r.toFixed(1), w.amp.toFixed(1)].join() : 0, R.ox, R.oy].join('|');
      if (key !== lastKey || w) {
        lastKey = key; c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, W, H);
        if (w) { const s = src.data, d = dst.data, sg = w.w, sg2 = 1 / (sg * sg);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - w.cx, dy = y - w.cy, dd = Math.sqrt(dx * dx + dy * dy) || 1;
            const e = (dd - w.r); const k = Math.exp(-e * e * sg2) * Math.sin(e / sg * 2.2) * w.amp;
            let sx = Math.round(x - dx / dd * k), sy = Math.round(y - dy / dd * k); sx = sx < 0 ? 0 : sx >= W ? W - 1 : sx; sy = sy < 0 ? 0 : sy >= H ? H - 1 : sy;
            const si = (sy * W + sx) * 4, di = (y * W + x) * 4; d[di] = s[si]; d[di + 1] = s[si + 1]; d[di + 2] = s[si + 2]; d[di + 3] = 255; }
          c2.putImageData(dst, 0, 0);
        } else c2.drawImage(base, 0, 0);
      }
      out.style.transformOrigin = `${R.ox}px ${R.oy}px`; out.style.transform = `scale(${R.scale})`; out.style.filter = R.blur > 0.05 ? `blur(${R.blur}px)` : 'none';
    } };
  },
});
