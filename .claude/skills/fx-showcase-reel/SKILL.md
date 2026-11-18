---
name: fx-showcase-reel
description: Recipe for justyn.ai's "format B" effects-showcase reel (about 26 s, one seated take, a right-side FX dashboard list, a new effect every ~1.2 s, ending on a newspaper that tears). Use when the user wants a reel that shows off or lists many effects, a "N effects in N seconds" video, or a showcase built from the effects/lib modules, with a real person or the shark avatar in front of the room.
---

# FX showcase reel (format B)

Measured from his reel DfnvcS1OdZi (spec: `lab/reel-DfnvcS1OdZi/FEATURES.md`); built once on the shark avatar as
`lab/reel-DfnvcS1OdZi/shark/film.html` (modules listed in `lab/reel-DfnvcS1OdZi/BUILT.md`). Copy that folder to start a new one.

## The grammar (don't drift)
- **One continuous seated/standing take**, locked camera. Every effect is a layer on it or a 0.7-1.7 s full-frame cut-away. Nothing is decoration:
  each visual illustrates the name being said.
- **The voice reads the effect names; there are no karaoke captions.** The dashboard is the caption. The only caption is the CTA stack.
- **Dashboard** (`fx-dashboard-panel`, right side, `#183727`): a white pill moves to the active row 0.3-0.7 s after the first word of its name;
  counter "nn / 20"; the "+ 50 more effects" badge turns gold at the CTA. Hide it only under the full-frame newspaper (24.0-25.7 s).
- **Pacing:** 21 effects in 25.7 s, one every 1.2 s (mean 1.24 s). Each visual lands 0.2-0.5 s after the first word of its name (Comment drop leads
  by 0.2 s on "edit"). 9 full-frame breaks (3.4 per 10 s), about 19% of the runtime is cut-aways. First word at 0.0 s, ~115 wpm, speech to 25.7 s.
- **Order that worked:** open with `layer-explode` (it shows the frame is made of layers), keep the loud full-frame moves apart
  (title-card-dive 3.3, screenplay-page 14.5, intertitle 20.6, press-front 24.0), put the CTA (`comment-drop` + `cta-stack`) at ~10-13 s, end on
  `press-front` then `paper-tear`, and hold the clean shot 0.7 s.
- **Audio:** voice only (-14 LUFS, peak -1 dBFS). No music bed. Short high-passed noise ticks (~100 ms) at effect starts, three of them in the gaps
  between words (13.22, 19.02, 22.39 s in his reel). `mkaudio.py` in the shark folder synthesizes them.

## Layer rules
Back to front, in the film's `#world`: room (`room-set`) -> `behind` (video-backdrop, post-wall, word-stamp, orbit-ring far letters) -> person matte
-> `front` (orbit-ring near letters, live-cursor, storyboard-deck, file-drop, blow-away, predict-keys, incoming-call, step-pill, comment-drop,
cta-stack). Outside the world: `cut` (full-frame cut-aways: layer-explode, title-card-dive, screenplay-page, code-body, intertitle, press-front,
paper-tear) then `top` (dashboard, title pills). Effects that put things behind the person need a **matte** (the shark rig gives one free);
dolly-zoom, rack-focus, shockwave and blow-away need a **clean plate** (the rig's `room` layer). Contributions to shared layers go through
`SK.frame.room / world / shark`; `room-set` is seeked last.

## Assemble a new one
1. Write the list: effect names in order with a spoken start time each (his are in `FEATURES.md` section 3 and `BUILT.md`). Generate one voice file
   per line (Kokoro `am_onyx`, speed 1.1-1.3), fit each into its slot (atempo up to 1.35) and place it at its word time (`shark/mkvoice.py`); get word
   timings **per line** with roughcut (whole-file timings drift ~0.3 s late).
2. Footage: `shark/cfg.json` (medium cam, yaw sway, gesture 0.85), `envelope.py voice.wav cfg.json`, then `shark/plates.py frames shark|room ...`
   (this folder's copy of `render_plate.py`; it serves the project root so the config can live outside `lab/shark`). The room layer is static: render 1 frame.
3. `film.html`: copy the shark one, edit `FX` (names, number, pill time) and the `reg(...)` list. Pass per-effect times via opts (every module takes `t0` etc.).
4. **Storyboard first** (`.claude/skills/reel-storyboard`): `shots.json` with one shot per beat, stills at each shot's peak (use `storyboard/stills.py`;
   `storyboard.py stills --film` only serves the film's own folder, so it can't load `effects/lib`), `build`, look at `grid.png`, fix, then render.
5. Render: `C:\Python314\python.exe effects/lib/render.py render film.html --T 26.4 --audio audio_final.wav --chunks 3 --sub 2`, then `render.py check film.html`.
6. QA against his reel frame by frame (`shark/compare.py` makes the side-by-side sheets) and score each effect on look, motion, timing.

## Gotchas
- `z-index` inside a layer without its own stacking context sorts against the whole world: negative z hides letters under the room. Use positive.
- CSS `overflow:hidden` + `perspective` + `preserve-3d` planes work in headless Chromium; `opacity < 1` on a plane flattens only its children.
- Springs overshoot: for slides that must not leave a gap (page, keyboard) clamp the translate to 0..1 and let only scale overshoot.
- Canvas `getImageData` on the plate image is fine because the film is served from the same origin.
