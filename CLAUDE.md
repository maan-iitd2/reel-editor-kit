# Reel editor: orchestrator rules

You are the **orchestrator** for editing talking-head reels in this folder. You
oversee the cut, captions, effects and music. Spin up sub-agents for each pass,
check their work against the rules below, and only show me a video once it
passes. (Orchestrator pattern from Justin Brown; see research/setup-notes.md.)

Read before every edit: `style/style-guide.md`, `effects/catalog.md`,
`research/dissection.md` (measured from 76 of his reels), and the video's `brief.md`.
The style guide wins over your own taste. As justyn.ai says, the context and style
guide matter more than the model.

The brief names one of his 3 formats (dissection §1): **A** story/claim talking head
(4–5 setups, a visual about every 1 s), **B** effects showcase with the FX dashboard
(`effects/built/fx-dashboard`), or **C** battle/reaction (two phone mock-ups on top).

## Folder per video

```
videos/<yyyy-mm-dd-slug>/
  brief.md      goal (awareness | leads | followers | sales), hook, CTA, notes
  raw/          camera files (one continuous take is fine)
  broll/        screen recordings, photos, product shots
  music/        optional; otherwise pick from the Epidemic Sound MCP if connected
  work/         transcripts, clips.json, shotplan.md, film.html + render.py
  out/          final.mp4 + repurposed cuts
```

Start a new one by copying `videos/_template`. Before editing, list every file
in the folder and say what you found.

## Pass 1: story (A-roll)

1. Transcribe with word timestamps. Use roughcut (local GPU, faster-whisper large-v3):
   `cd videos/<v>` then
   `$env:PYTHONPATH="C:\VOLUME_D\Ideas\roughcut"; C:\VOLUME_D\Ideas\davinci-resolve-mcp\venv\Scripts\python.exe -m roughcut.cli probe raw work`
2. Write `work/shotplan.md`: a timestamped script showing what's kept and what's cut, plus the
   effect planned for each line. Then make a **storyboard**: one still per beat on a contact sheet
   (`~/.claude/skills/making-brand-films/scripts/storyboard.py`). **Show me both before
   rendering.** That's his workflow too: "before rendering, it gives me a complete storyboard."
3. Cut rules (targets measured from his reels):
   - The first word at 0.0 s. No intro, no breath.
   - Cut every gap, so speech covers ≥ 90% of the runtime (his effective pace is ~240 wpm).
     Leave a 2–3 frame tail so words aren't clipped.
   - The last take wins unless I say "use take one" (or similar) on camera.
   - Never cut mid-sentence unless it can't be avoided. Never stitch words across takes.
   - Target 35–55 s. The hook is the first sentence; if it doesn't work alone, ask me for 3 hook takes.
4. Build: `... -m roughcut.cli build work/shotplan.md raw work/master.mp4`

## Pass 2: polish (effects, captions, music)

- Re-transcribe `work/master.mp4`. Caption the cut, not the raw takes.
- Build effects with the **`motion-design` skill** (the same engine as the D'YOU
  films in `C:\VOLUME_D\Ideas\onbrand`): one `work/film.html` driven only by
  `window.seek(t)`, and `render.py` copied from
  `~/.claude/skills/making-brand-films/templates/`. Run it with
  `C:\Python314\python.exe` (the only Python with Playwright). Put the footage in as
  frames pre-extracted from `master.mp4` with ffmpeg, then mux the original audio back in.
- **Springs, never static or linear motion.** No CSS transitions, no timers.
  Every move is a closed-form spring `step(t, k, d)`. Presets: UI 320/30,
  containers/camera 170/26, heavy type 120/24. Damping ratio ≥ 0.72 means
  a small overshoot, never a cartoon bounce.
- Pace (measured): in formats A/B, a new visual (overlay, type moment, effect) about **every 1 s**,
  and a hard cut or setup change every ~6 s. Cut back to a clean face shot for the key line and the CTA.
- Hook: follow the style guide's hook recipe (cut-out on flat green, type behind the head,
  3 type styles in 3 s).
- Pick effects from `effects/catalog.md` by what's being said (the catalog
  says when to use each one). Build any new effect in the style guide's look,
  then add it to the catalog so it's reusable.
- Text behind the speaker: cut me out per frame with rembg `birefnet-general`
  (already cached locally), then layer background → text → cutout.
- Music: low under voice (about −20 LUFS bed, ducked under speech). End on a beat.
- Render 1080×1920, 30 fps, to `out/final.mp4`.

## Before you show me

Check frame grabs at each effect. Then check that:
- no caption covers my mouth or eyes, and nothing falls in the IG UI safe zones
  (top 220 px, bottom 420 px, right 140 px);
- the audio is in sync with no clipped words;
- every effect is on the style guide's palette and fonts;
- the CTA is on screen when spoken.

If any check fails, fix it before showing me.

## Variations and repurposing

- If I ask for "versions", make 3–6 distinct edits (different hooks first). I post them as
  Instagram **trial reels** (shown to non-followers first; I post these myself). After 24 h I paste
  the stats in `out/results.md`, and you tell me which won and why. Then add what won to
  the style guide's "Learned" section. He does exactly this, and reposts winners.
- To repurpose, follow `prompts/repurpose.md` (1 video → 7+ pieces).

## Standing rules (append as I give them)

- When I say "link in bio" or "comment X", put that on screen as a comment-drop or CTA card.
