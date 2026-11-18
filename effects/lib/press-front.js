// effects/lib/press-front.js
// doc: hard cut to a full-frame cream newspaper, "The Daily Reel": masthead, boxes, dateline, huge condensed headline, columns of
//   small type, and the live footage as a coarse black-and-white halftone photo; "Comment EDIT" pull-quote at the bottom. The
//   dashboard is hidden underneath. Trigger: "press front". Needs opts.foot (the photo is the live composite).
//   Source: reel DfnvcS1OdZi 24.00-25.40 s (E20). Paper #EFE8D6, ink #1C1A16. copy() returns a live duplicate (used by paper-tear).
K.register('press-front', {
  needs: ['full'],
  doc: 'full-frame newspaper with live halftone photo and "Comment EDIT" quote',
  create(stage, opts) {
    const L = SK.layer(stage, opts, 'cut'), F = SK.FONT;
    const o = Object.assign({ t0: 24.0, end: 25.75, mast: 'The Daily Reel', name: 'the shark', date: 'TUESDAY, NOVEMBER 10, 2026' }, opts);
    const list = ['Layer explode. The frame in its real sheets.', 'Word stamp. One serif word, behind the head.', 'Live cursor. A cursor named Claude moves the man.', 'Title card dive. A title card, then the dive.', 'Orbit ring. Type goes round the head, behind it and in front.', 'Dolly zoom. The wall rushes forward, the shark holds its size.', 'Storyboard deck. The boards, dealt like cards.', 'Code body. The code that made this reel.', 'Blow away. Gone to dust, and back.', 'Comment drop. Four letters fall into a comment box.'];
    const rest = ['Shockwave. One ring through the room.', 'Screenplay page. The lines, set as a script.', 'File drop. A file falls into a drop zone.', 'Video backdrop. A video plays behind the shark.', 'Rack focus. The room goes soft.', 'Incoming call. A call rings mid sentence. Declined.', 'Intertitle. A silent film card, in serif.', 'Predict keys. A keyboard types the name.', 'Post wall. One square per real day posted.', 'Press front. This page, live in the photo.', 'Paper tear. The page rips in two on the word.'];
    const paints = [];
    const build = (parent) => {
      const R = SK.el('div', `left:0;top:0;width:1080px;height:1920px;background:${SK.PAL.paper};overflow:hidden;color:#1C1A16`, parent);
      SK.el('div', 'left:0;top:0;width:1080px;height:1920px;opacity:.5;background-image:radial-gradient(rgba(60,50,30,.06) 1px,transparent 1.3px);background-size:6px 6px', R);
      const box = (x, y, w, h, html) => SK.el('div', `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:2px solid #1C1A16;padding:8px 10px;box-sizing:border-box;text-align:center;font:400 17px/20px ${F.body}`, R, html);
      box(22, 56, 200, 100, `<span style="font:700 19px ${F.news}">Final Edition</span><br>This page is on sale for 1.6 seconds`);
      box(860, 56, 200, 100, `<span style="font:700 19px ${F.news}">Late News</span><br>Comment EDIT to get access to these`);
      SK.el('div', `left:0;top:30px;width:1080px;text-align:center;font:700 128px/150px ${F.news};letter-spacing:-.01em`, R, o.mast);
      SK.el('div', `left:22px;top:196px;width:1036px;font:500 17px/22px ${F.body};letter-spacing:.12em;border-top:3px double #1C1A16;border-bottom:2px solid #1C1A16;padding:6px 0;display:flex;justify-content:space-between`, R, `<span>SHARK.AI</span><span>${o.date}</span><span>SET BY CLAUDE</span>`);
      SK.el('div', `left:14px;top:250px;width:1052px;text-align:center;font:700 176px/150px ${F.news};white-space:nowrap`, R, '<span style="display:inline-block;transform:scaleX(.8);transform-origin:50% 50%">20 VIDEO EFFECTS</span>');
      SK.el('div', `left:0;top:400px;width:1080px;text-align:center;font:italic 400 70px/76px ${F.body}`, R, 'in 20 seconds, built by Claude.');
      const col = (x, y, w, title, items, h) => { SK.el('div', `left:${x}px;top:${y}px;width:${w}px;font:700 27px/30px ${F.news};text-align:center`, R, title);
        SK.el('div', `left:${x}px;top:${y + 36}px;width:${w}px;height:${h}px;overflow:hidden;font:400 18px/22px ${F.body};text-align:justify;hyphens:auto`, R, items.map(s => `<i>${s.split('.')[0]}.</i> ${s.split('.').slice(1).join('.')}`).join(' ')); };
      col(22, 500, 248, 'The List', list, 700); col(802, 500, 256, 'The rest', rest, 640);
      SK.el('div', `left:802px;top:490px;display:none`, R, '');
      const ph = SK.el('div', 'left:284px;top:500px;width:500px;height:742px;background:#EFE8D6;border:2px solid #1C1A16;box-sizing:border-box;overflow:hidden', R);
      const cv = SK.el('canvas', 'left:0;top:0;width:496px;height:738px', ph); cv.width = 496; cv.height = 738; paints.push(cv);
      SK.el('div', `left:284px;top:1250px;width:500px;text-align:center;font:italic 400 19px/22px ${F.body}`, R, `Shark, reading the list, at his desk.`);
      SK.el('div', `left:22px;top:1300px;width:248px;font:700 25px/28px ${F.news};text-align:center;border-top:2px solid #1C1A16`, R, 'In This Reel');
      SK.el('div', `left:22px;top:1340px;width:248px;font:400 17px/24px ${F.body}`, R, list.slice(0, 7).map((s, i) => `<div style="display:flex;justify-content:space-between"><span>${s.split('.')[0]}</span><span>0:0${i}</span></div>`).join(''));
      SK.el('div', `left:284px;top:1300px;width:500px;text-align:center;font:italic 400 62px/68px ${F.body};letter-spacing:-.01em`, R, '&ldquo;Comment EDIT to get access to these, plus 50 more effects.&rdquo;');
      SK.el('div', `left:284px;top:1580px;width:500px;text-align:center;font:700 25px/28px ${F.news};border-top:2px solid #1C1A16;padding-top:6px`, R, 'Correction');
      SK.el('div', `left:284px;top:1620px;width:500px;font:400 18px/22px ${F.body};text-align:justify`, R, 'The shark read the names. Claude made the effects. This edition regrets any confusion.');
      box(802, 1300, 256, 140, `<span style="font:700 22px/24px ${F.news}">AI Video Editing Masterclass</span><br>BY SHARK<br><i>Comment EDIT to get access.</i>`);
      SK.el('div', `left:802px;top:1480px;width:256px;font:700 25px/28px ${F.news};text-align:center`, R, 'Weather');
      SK.el('div', `left:802px;top:1516px;width:256px;font:400 18px/22px ${F.body};text-align:justify`, R, 'Indoors. Dark green walls, one bronze clock. Fins crossed for a fair breeze.');
      SK.el('div', `left:22px;top:1750px;width:1036px;font:italic 400 18px/22px ${F.body};text-align:center;border-top:2px solid #1C1A16;padding-top:8px`, R, 'Read aloud by a shark. Set, cut and printed by Claude, one frame at a time, in one ink.');
      return R;
    };
    const root = build(L); const cx = paints[0].getContext('2d'); const tmp = document.createElement('canvas'); tmp.width = 124; tmp.height = 184; const tg = tmp.getContext('2d', { willReadFrequently: true });
    function halftone(cv) { const g = cv.getContext('2d'); const big = halftone.big || (halftone.big = document.createElement('canvas')); big.width = 248; big.height = 368; opts.foot.paint(big.getContext('2d'), 248, 368); tg.drawImage(big, 48, 70, 152, 226, 0, 0, 124, 184); const d = tg.getImageData(0, 0, 124, 184).data; let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4) { const v = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; if (v < lo) lo = v; if (v > hi) hi = v; } g.clearRect(0, 0, 496, 738); g.fillStyle = '#1C1A16';
      const step = 4; for (let y = 0; y < 738; y += step) for (let x = 0; x < 496; x += step) { const i = (Math.floor(y / 4.02) * 124 + Math.floor(x / 4)) * 4; let l = ((d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) - lo) / Math.max(1, hi - lo); l = Math.min(1, Math.pow(l, .75) * 1.1); const r = (1 - l) * step * .72 + .2; g.beginPath(); g.arc(x + 2, y + 2, r, 0, 6.3); g.fill(); } };
    return { el: root, copy() { const c = root.cloneNode(true); const cvs = c.querySelectorAll('canvas'); paints.push(cvs[0]); cvs[0].width = 496; cvs[0].height = 738; return c; },
      seek(t) { const live = t >= o.t0 && t < o.end; root.style.display = live ? 'block' : 'none'; if (!live && !paints.some(p => p.isConnected && p.offsetParent)) return; if (t >= o.t0 && t < o.end + .4) paints.forEach(halftone); } };
  },
});
