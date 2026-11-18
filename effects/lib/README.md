# Effect library: one file per effect, shared by every film

Each effect is a reusable module in this folder, `<slug>.js`, loaded as a classic `<script>` after `core.js`.

```js
// effects/lib/word-stamp.js
// doc: what it looks like, which spoken word triggers it, source reel + time it was copied from
K.register('word-stamp', {
  needs: ['subject'],                 // plates it needs: subject (RGBA cutout), clean (empty room), full (composite)
  doc: 'heavy serif word stamps in behind the head, letter by letter',
  create(stage, opts) {               // stage = a positioned 1080x1920 container; opts = {at, word, ...}
    const el = document.createElement('div'); stage.appendChild(el);
    return { seek(t) { /* everything from t; K.vis / K.sp springs only */ } };
  },
});
```

Rules (from CLAUDE.md and the motion-design skill):
- Pure functions of `t`. Springs only (`K.P.UI` 320/30, `K.P.BOX` 170/26, `K.P.HEAVY` 120/24). No CSS transitions, timers or `Math.random` (use `K.mulberry32`).
- No frozen frames: keep a small drift alive while an effect holds.
- Each effect lands on its trigger word's start time, taken from per-line word timings.
- 9:16 at 1080×1920. Keep text out of the IG safe zones (top 220, bottom 420, right 140 px) unless the reel being copied puts it there on purpose; note it in the doc if so.
- Colours: use the measured palette from the reel being copied (each FEATURES.md lists it). Shared tokens are in `style/style-guide.md`.

Plates come from the shark rig (`lab/shark`, see `.claude/skills/shark-avatar`): `subject` = RGBA shark frames,
`clean` = room-only frames (a free clean plate), `full` = both. Load them with `new K.Plate(img, 'path/%05d.png', count)`.

Render: `C:\Python314\python.exe effects/lib/render.py probe|render|check <film.html> ...` (serves this whole folder over localhost).
The index of built effects is in `effects/catalog.md`. Add a row when an effect lands here.
