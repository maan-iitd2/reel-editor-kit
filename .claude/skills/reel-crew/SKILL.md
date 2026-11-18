---
name: reel-crew
description: One-Go production crew for a short video or video resume in this folder, modelled on /crew. The director plans from the script and design, parallel workers build the voice, music, /brag promo clips and shot groups, a storyboard in justyn's format gets the user's one Go, then a harsh critic scores every shot and the audio against fixed rubrics; anything at 7/10 or below goes back with a measurable fix (max 2 rounds) before the final render. Use when the user says /reel-crew, "make the video", "run the crew", or wants a video produced end to end with quality gates.
argument-hint: <video folder, e.g. videos/2026-11-18-aparna-video-resume>
---

# /reel-crew

You are the **director**. You plan, brief, integrate and judge; workers do the heavy reading and building.
The user approves exactly once, at the storyboard. After that, run to the end without asking.

## 0. Load the house rules (read, don't skim)
`CLAUDE.md` (this folder) · the video's `brief.md`, `script.md`, `DESIGN.md` · `.claude/skills/reel-storyboard/SKILL.md` ·
`effects/lib/README.md` · `effects/lib/audio_check.py` (docstring = audio targets) · `effects/catalog.md` ·
`research/dissection.md` §7–8 (justyn's own method: brand guide + inspo → explain every edit → storyboard → render → versions).

## 1. Plan the pieces (one message, run in parallel where independent)

| # | Piece | Agent / model | Done when (evidence, not opinion) |
|---|---|---|---|
| V | **Voice + timing**: TTS of the final script, per-line clips, per-line word timings | `builder` / sonnet | `audio_check.py voice` = PASS, including **pace 170–195 wpm over the whole track**; `timeline.json` has a time for every displayed word |
| M | **Music + sound design**: pick the bed, plan SFX on beats, later the mix | `builder` / sonnet | `audio_check.py music <track>` = PASS; licence noted (Mixkit = free commercial); SFX list with times |
| B1..Bn | **Promo clips**, one per project the person built: `/brag` (brag-slim) on each repo, 8–15 s, in **that project's own brand colours and fonts** | `builder` / opus, one per repo, parallel | `brag.mp4` exists, plays, 8–15 s, and its colours are sampled from the project's CSS (list the hexes) |
| S1..Sk | **Shot groups**: split the storyboard into 3–4 contiguous groups; each worker builds its group's effect modules in `effects/lib/` and its section of `work/film.html` | `builder` / opus, parallel | `render.py probe` stills of every shot in the group, with no page errors |
| C | **Critic** (read-only, default reject) | `verifier` / opus | rubric table below, with every row ≥ 8 |

Pieces that edit the same file run in order. Shot groups each own their own `work/shots/<group>.js` file, and the director wires them into `film.html`.

## 2. The worker brief (every worker gets all of this; they can't see the conversation)
```
OBJECTIVE:  what this piece must achieve (not how)
WHY:        who the video is for and what it must make them feel or believe (from brief.md / DESIGN.md)
CONTEXT:    paths, the exact script lines and times it covers, palette hexes, fonts, the facts it may state
            (and that it may NOT invent any), the effects/lib contract, which spoken word each visual lands on
SKILLS:     e.g. motion-design, brag, humanizer (for any on-screen copy), reel-storyboard
BOUNDARIES: files it owns; never overwrite another worker's slug or the person's raw material; no commits, no uploads
CHECK:      the command + expected output that proves it (render.py probe, audio_check.py, ffprobe duration)
RETURN:     files made, check output verbatim, anything not done, stated plainly
```

## 3. Storyboard → the one Go
Build `work/shots.json` (one shot every 1–3 s; `aspect` 16:9 for resumes, 9:16 for reels), get stills from the
probe frames, and run `storyboard.py build`. **Send the user `grid.png` plus 3 beat cards** (SendUserFile) and ask one
question: Go / change shots. Apply changes and re-show. After Go, don't ask anything until delivery.

## 4. The critic (send this prompt as written)
```
You are the harshest motion director and sound engineer this video will ever meet. You did not build it and you
do not care who did. Default answer: REJECT. For EVERY shot in shots.json, look at the probe still at the shot's
middle AND a 12-frame strip around its key move (ffmpeg -ss <t-0.2> -vf "fps=30,scale=320:-1,tile=12x1"), then
score 1-10 on each axis:
  1 HOOK/STORY   does this beat earn its seconds, and does it push the story forward? (first 3 s: would you keep watching?)
  2 READABILITY  every word readable at phone width (render at 360 px wide): size, contrast, nothing over a face
  3 SYNC         the visual lands on its spoken word: measure the frame vs timeline.json, and > 0.10 s off caps this at 6
  4 MOTION       springs only, no linear slides, no frozen frame longer than 1 s, no 1-frame flashes, no jumpy pops
  5 CRAFT/BRAND  palette and fonts from DESIGN.md (or the project's own brand inside brag clips), clean spacing,
                 no AI-slop tells (gradient blobs, purple glow, emoji, centered-everything, fake UI data)
  6 TRUTH        every number/claim traces to the person's answers/CV (facts.md); every mock UI says ILLUSTRATION
Then the audio: run audio_check.py voice/music/mix and paste the PASS/FAIL lines. Listen-proxies count: a FAIL is a 4.
Output a table: shot | t | scores 1-6 | min | the ONE fix that would raise the min, stated measurably
("move caption up 140 px so it clears the chin", "land the stamp 6 frames earlier on 'Human'").
Any shot whose min is 7 or below is a FIX ticket. Do not round up. Do not praise.
```

## 5. Fix rounds
Send every ticket back to the worker that owns that shot or piece, with the critic's measurable fix plus the original
brief. Re-probe only the changed shots, then send those shots back to the critic. **At most 2 rounds.** After that, ship
and list what is still ≤7 and why.

## 6. Render + deliver
1. `render.py render work/film.html --T <dur> --audio out/mix.wav --chunks 3 --sub 2`
2. `render.py check`
3. `audio_check.py mix out/final.mp4 --voice-stem work/voice.wav`
4. Re-run the critic on the final contact sheet.
5. Deliver `out/final.mp4` with: the scorecard, the audio PASS lines, what is illustrative, and what still
   needs the person (their real voice, photos, links).

## House audio standard ("not too high, not too low, slightly fast")
Kokoro voice measured and passing: **af_heart** (female, 199 Hz, the most expressive) or **bf_emma** (British).
Male: am_onyx / am_michael (check them first). Tune `speed` until the WHOLE track is 170–195 wpm. Bed about 112 BPM,
ducked so the voice sits ≥ 14 dB over it while speaking. Mix at −14 LUFS, true peak ≤ −1 dBTP. The numbers live in `audio_check.py`.
