# Effects catalog

This is the effects library, the part justyn.ai calls his "60+ effects". The first 20 are the ones
named in his "20 effects in 20 seconds" reel (see research/setup-notes.md).
Each is a spec. The first time one is needed, Claude builds it as a `seek(t)` layer with
spring motion (`motion-design` skill) and saves it in `effects/built/<slug>/`. After that it's reused.

Status: `spec` = described, not built yet · `built` = reusable composition exists.
Durations assume 30 fps.

| # | Effect | Use when you say… | Build notes | Len | Status |
|---|---|---|---|---|---|
| 01 | Magazine cover | a big claim or a "this changes everything" hook | full-frame cover: huge serif masthead behind your head (needs a cutout), date line, seal, barcode | 1.5s | spec |
| 02 | Knockout captions | the one word that matters | the word lands in serif, then a `--paper` panel fills the top third with it in huge condensed caps | 1s | spec |
| 03 | Live markup | "look at this", pointing at yourself or a detail | drop to B&W, a `--marker` hand-drawn circle draws on (stroke-dashoffset), script label | 1s | spec |
| 04 | Film look | a section change or mood shift | light sweep across the frame, then settle into a warmer, darker grade with grain | 0.8s | spec |
| 05 | Jiggle delete | "you don't need X anymore" | iOS-style tray of app icons that jiggle, then delete one by one, ending on a "0 apps" label | 1.5s | spec |
| 06 | Screenplay page | listing things, or a story beat | frame becomes a script page ("INT. … DAY", your name, "(to camera)"); each spoken item highlights; ends "CUT TO:" | 2–4s | spec |
| 07 | Grid collapse | comparing yourself to "everyone else" | your shot shrinks into the centre of a 3×3 grid of other clips, then the grid flies apart | 1.2s | spec |
| 08 | Prompt bar | quoting a prompt | glassy chat input drops in, types the prompt (mono), words morph to handwriting | 1.5s | spec |
| 09 | Contact sheet hook | the hook line | shot shrinks into a contact sheet that fills frame by frame, then "HOOK" lands in italic serif | 1.2s | spec |
| 10 | Keycaps | shortcuts, "one click", speed | 3D keycaps (⌘K, ⌘Z, J/K/L, space) rain down around you | 1s | spec |
| 11 | Comment drop | the CTA ("comment X") | IG-style comment box types the CTA and posts, reply drops in, like count ticks | 1.5s | spec |
| 12 | Picture dive | "let's go deeper", a transition | a frame on the wall pulls forward with you inside, camera pushes through | 1s | spec |
| 13 | NLE timeline | talking about editing or time saved | timeline slides up from the bottom: V/A tracks, moving playhead, timecode | 1.5s | spec |
| 14 | Playing grid | "I made N versions" | small 2×3 grid of clips playing at once in a top corner | 1.5s | spec |
| 15 | Serif stamp | a verdict word (DONE, FREE, NO) | heavy serif letters stamp in one by one with overshoot, script word above | 0.8s | spec |
| 16 | Icon strike | "stop using X" | tool icons pop in at the top, a red hand-drawn line strikes one | 1s | spec |
| 17 | Grease pencil sheet | explaining what got cut | film contact sheet with red notes: "idea" circled, "dead air" crossed out, "cut" | 1.5s | spec |
| 18 | Lens ring | a zoom or focus change, emphasis | focal-length scale (85 70 50 35 24) slides across the top while the shot punches in | 1s | spec |
| 19 | Reel cascade | "I post every day", volume, results | small reel cards tumble in and settle into a grid of 8 vertical clips | 1.5s | spec |
| 20 | Video card | referencing another video or a demo | wide player card slides in above you showing the clip, with a title | 1.5s | spec |

## Set 2: from his dashboard reel (Dfcr8TJMKCV, his most-liked)

All `spec`. Seen at 1 fps, so the details are approximate.

| Effect | Use when you say… | What it looks like |
|---|---|---|
| Live cursor | "Claude did this" | selection box around you with pixel size and a "Claude" cursor tag dragging it |
| Clone row | "me, me, me" / volume | copies of you step out to the sides |
| Day dial | days, schedules | a big cream dial with day labels rotates in from behind |
| Predict keys | typing, shortcuts | keycaps fly in |
| Orbit ring | ecosystem, tools around you | a ring of icons orbiting your head |
| Code body | "it's all code" | you re-rendered as ASCII/code characters |
| Post wall | "1,711 people" / volume | a wall of tiny post thumbnails with a ticking counter |
| Letter dive | a reveal | the camera dives into a letter of a title |
| Layer explode | "how it's built" | the frame splits into 3D layers labelled TYPE / LIST / SOUND / ROOM, plus a waveform |
| Sketch words | ideas | a word drawn as pencil sketch strokes, with "sketch" in script |
| Blade slice | cutting / editing | blade labels slice across, with a "Press" tag |
| Head stack | identity, personas | your head duplicated in a vertical stack |
| Rack focus | "focus on X" | focus pulls from background to you |
| Banknote | price, value, offer | you engraved on a banknote with the offer name on it |
| Voice note | "I sent a voice note" | an IG voice-note bubble with a waveform |
| Impact frame | the punchline | black-and-white manga ink portrait, speed lines, "IMPACT" |
| Dolly zoom | realisation | vertigo zoom on the face |
| Press front | the big announcement | full-frame newspaper ("The Daily Reel") with you as the photo |
| Paper tear | before/after | the frame tears like paper to reveal the next shot |
| Blow away | ending | you dissolve into particles, revealing the empty chair |

## Baseline effects (use constantly)

| Effect | Use | Notes |
|---|---|---|
| Punch-in | the key sentence | 100→112% scale over 8 frames, hold, then cut back |
| Text behind speaker | the title for a section | needs a per-frame cutout (rembg birefnet); serif word sits between the background and you |
| Word captions | always | style-guide caption rules; key word in `--accent` |
| **FX dashboard** (counter panel) | showcase reels (format B) | **built** → `effects/built/fx-dashboard/`. Edit the `FX` config (names + start seconds) in `film.html`; colours sampled from his reels. Demo: `out/silent.mp4` |

## Adding effects

When a new effect looks good, add a row here with the trigger ("Use when…").
That trigger column is what lets Claude pick effects from the transcript.
