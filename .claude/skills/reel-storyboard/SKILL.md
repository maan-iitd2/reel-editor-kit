---
name: reel-storyboard
description: Make a justyn.ai-style storyboard for a short video before rendering it: a grid of shot cards (9:16 still, green bar with shot id and time range, italic-serif quote) plus one stacked "beat card" per shot (description on ruled paper with gold-underlined key phrases, SOUND and SCORE rows, a "Comment on this beat" button). Use whenever a reel or short video is being planned in this folder, whenever the user says storyboard or shot plan, and always before a full render (his step 7: approve the storyboard, then render).
---

# Reel storyboard (justyn.ai format)

Copied from his reel DeZ4D0Pvoxl (32–38 s: "before rendering, it gives me a full storyboard"). Reference frames:
`references/videos/20261012_DeZ4D0Pvoxl.mp4` at 34.3 s (grid) and 37.6 s (beat card).

## When
Before any full render. Show the user `grid.png` and the beat cards, take their notes per beat, change `shots.json`,
rebuild, and render only after they approve.

## How
1. Write `shots.json` next to the video's work files. Set `"aspect": "16:9"` for landscape videos (3 wide cards per row); the default is 9:16. Make one shot per beat (a new visual about every 1–3 s), with these fields:
   - `id` (`p01`…), `t0`/`t1` in seconds from the timeline (per-line word timings);
   - `label` (shot type + framing, e.g. "Talking head, wide");
   - `quote` (the exact spoken words);
   - `beat` (what happens on screen and on which word; wrap key phrases in `==…==` for the gold underline);
   - `sound`, `score` (the musical or emotional job of the beat).
2. Get the stills, either from a rendered or rough video or from a `seek(t)` film (it grabs the middle of each shot):
   ```bash
   S="C:/VOLUME_D/Ideas/Content Creation/.claude/skills/reel-storyboard/storyboard.py"
   /c/Python314/python.exe "$S" stills shots.json --video work/rough.mp4
   /c/Python314/python.exe "$S" stills shots.json --film work/film.html --w 1080 --h 1920
   ```
   With no footage yet, build style frames first and point `still` at them.
3. Build: `/c/Python314/python.exe "$S" build shots.json [--out dir]` → `storyboard.html`, `grid.png` (4 cards per row, 2× scale),
   `beats/<id>.png` (transparent PNGs, usable as overlays in the reel itself, as he does in his reel).
4. Look at `grid.png` and two or three beat cards yourself before showing the user.

## Look (measured from his frames; don't drift)
- Card paper `#F2EEE3`, bar and header green `#1F3A2B`, gold `#C9A24E` (id and underlines), ink `#2A2925`, page `#18291F`.
- Type: JetBrains Mono (ids, times, labels), Instrument Serif italic (beat title), EB Garamond (quotes, body, rows), Inter (button).
  The fonts are bundled in `fonts/`, with `fonts.css` pointing at them.
- The beat body sits on 44 px ruled lines; the paper stack is two rotated sheets behind.

The script self-checks with `python storyboard.py` (asserts time formatting and highlight escaping).
