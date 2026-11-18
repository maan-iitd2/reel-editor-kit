---
name: shark-avatar
description: Render talking or walking footage of the 3D shark avatar (upright shark in a black puffer jacket and sneakers, three.js) as RGBA cutout plates plus a room background, lip-synced to a Kokoro voice line. Use when an effect, edit or storyboard needs test footage without a real person on camera, or when the user mentions the shark avatar.
---

# Shark avatar

Everything lives in `C:\VOLUME_D\Ideas\Content Creation\lab\shark\`. Read its `README.md` for the full config. In short:

1. Voice: Kokoro (`am_onyx`, speed 1.1) through `C:\VOLUME_D\Ideas\light\.venv\Scripts\python.exe`.
2. Write a config with `keys` (`cam` wide/medium/close/low/top, `yaw`, `x`/`z`, `walk`, `gesture`, `camShift`).
3. `envelope.py voice.wav cfg.json` fills the mouth curve and the duration.
4. `render_plate.py probe cfg.json both 1 3 5` to look at stills first.
5. `render_plate.py frames cfg.json shark <dir>` gives RGBA PNGs (a free cutout); `... room <dir>` gives the background.
6. Composite: room → your type/graphics → shark → UI/captions (ffmpeg `overlay`, or `<img>` frames inside a `seek(t)` film served over http).

Renders on the GPU (ANGLE D3D11) at about 0.2 s per frame. Deterministic: the same t always gives the same frame.
Proven: `lab/shark/out/talk.mp4` (7 s, lip-synced, medium → close push).
