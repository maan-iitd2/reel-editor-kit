---
name: making-brand-films
description: Use when asked to make a product video, brand film, reel, ad or "spec ad" for a real brand in that brand's own look and feel, e.g. from its Instagram page or website, or "make a video for <brand>/<product> that feels like them". Covers brand palette/font extraction, product footage, brand-matched music and ASMR sound.
---

# Making brand films

**REQUIRED BACKGROUND:** the `motion-design` skill (seek(t) engine, springs, Playwright render, critique loop). This skill adds the brand layer on top.

Core idea: a film feels "on brand" when **one product, one colour world, one voice and one sound** all come from evidence (their site source, their posts), never from defaults.

## Flow

1. **Brand kit (evidence first)**
   - `python scripts/brand_kit.py brand.com` → `brand/<brand>/kit.json`, logo, `STYLE.md` (`STYLE.generated.md` if a hand-written one exists). No API key needed; `BRANDFETCH_API_KEY` / `LOGODEV_TOKEN` are optional enrichment. Paid fonts get a free stand-in. JS-heavy sites fall back to an archetype.
   - **Correct it against the posts.** Palette and voice come from site CSS and copy only. Instagram: open the profile in the built-in browser. If a login wall appears, ask the user to sign in **themselves** in the pane (never type credentials). Open 5-8 *graphic* posts (text-on-image), screenshot each.
   - `python scripts/palette.py ink <shot> x y w h` on each headline box, `top` on backgrounds. Point samples miss thin strokes. Fix the generated colours, fonts and voice in `STYLE.md` (shape: `templates/STYLE.example.md`): type roles, core colours, per-product colour worlds, layout grammar, voice, motion + sound translation.
   - Product catalogue + image URLs: `python scripts/brand_scrape.py https://brand.com --products`.
2. **Read the feeling.** From bio, captions, product copy: what do they want to *feel* like (calm/clinical/playful/luxe/hype)? Map it:

   | Brand feel | Music (Mixkit) | SFX | Pacing |
   |---|---|---|---|
   | calm, premium, wellness | piano / ambient, 60-95 BPM | close-up ASMR: mist, cap click, drop, swipe | cut on bars (2-4 s), soft dissolves |
   | playful, Gen-Z | lo-fi / pop 90-115 | pops, bubbles, ticks | cut on beats |
   | bold, sport, hype | trap / house 120-140 with a drop | whooshes, impacts | product slams on the drop |

3. **Ask** (AskUserQuestion, recommended first): which ONE product, which sound mood. Recommend the product their current campaign pushes.
4. **Assets** into `films/<name>/assets/`:
   - Product + lifestyle images: Shopify `products.json` image list (often lifestyle shots beyond the packshot; prefer the brand's own).
   - Footage: `python scripts/mixkit.py video <kw>` → `get video <id> --to assets/footage`. Contact-sheet every clip before using.
   - Music + SFX: `mixkit.py music tag/piano ambient`, `mixkit.py sfx spray click`. Real trending audio can't be embedded (licensed inside the app only): say so, cut on a grid it can be swapped onto.
5. **Grid:** `python scripts/beatgrid.py song.mp3 --drop 10 20`. The BPM fit can be off by a few % on intros; trust the drop and the repeating onsets (bar candidate) and check the onset list. Pick cut unit (beat/bar), start the song so a bar line (or the drop) hits t=0 / the reveal; let the swell land on the end card.
6. **Grade into one colour world:** pre-extract footage frames with crop to 9:16 + ffmpeg `eq`/`colorbalance` toward the product colour; in HTML add a `mix-blend-mode:color` tint + milky wash over photos.
7. **Story (one product):** hook readable on frame 0 (question or pun in brand voice) → product in use (footage) → brand lifestyle still → product hero that pays off the hook → proof (ingredients/claims from their own pages, brand claims footnoted) → lifestyle → end card (wordmark, product, URL).
8. **Storyboard (approval gate):** copy `templates/STORYBOARD.template.md` to `films/<name>/storyboard/STORYBOARD.md` and fill the shot table (or `python scripts/storyboard.py skeleton films/<name>` to seed it from an existing `film.html`), then `python scripts/storyboard.py sheet films/<name>` → `storyboard/storyboard.html` (one still per beat, safe-zone toggle, timeline bar, HOOK badge on beats starting before 3 s, flag on beats with no on-screen text); the sheet is a terse phone-width column that includes a playable soundtrack sample (the film's `render.py audio` mix, with a play-from-here button per beat), so keep the table cells short (word limits in the template). Show it to the user. This format (vertical sheet, terse cells, playable audio) is the user-confirmed standard for every film; don't change it without asking. **Render only after explicit approval; approval is per film.** Judge it against (rough third-party guidelines, not rules): hook lands in the first 3 s; message readable with sound off (on-screen text); 15-30 s total, or under 15; beats = hook / build / payoff / CTA. Stills are taken at beat midpoint (a final end-card beat may look partial); safe-zone margins are rough.
9. **Build** from `templates/film.html` + `templates/render.py` (the inbalance film: shot table, dissolves, frame loader, product mask, bloom-under-type end card, SFX `place()` by peak). Edit the SHOTS table, copy, colours, assets, SFX cue list. Changing the SHOTS table after approval means re-running `sheet` and re-approving.
10. **Check:** `python render.py probe <times>` at **mid-shot** times (shot starts show half-risen text) → fix → `full` in background → `audio` → `mux` → `check`. Read the contact sheet and score per motion-design §8; fix anything under 8.

## Common mistakes (all hit for real)

| Symptom | Fix |
|---|---|
| Brand's claim text bleeds in at a product shot's edge | `-webkit-mask-image` the image's text side + layer bg = that shot's backdrop colour; re-probe and zoom the edge |
| Fleck of a word visible before it rises | `visibility:hidden` until its rise starts (template `rise()` does this) |
| End text appears late / blank colour beat | bloom layer must sit **under** the end-card type (z-order), end card has no own bg |
| Bloom leaves corners uncovered | radius from the bloom centre to the *farthest* corner, ×1.05 |
| Photo peeks in before the flood covers | `visibility:hidden` until flood radius is full |
| Page never sets `window.ready` | hundreds of parallel `img.decode()` reject on file://: wait on `onload` |
| Beat zoom "pops" on a still end card | stop beat punches before the end card |
| Mux overwrites the previous cut | copy `out/<name>.mp4` to `_v1` before re-rendering |
| Rendered before the storyboard was approved | storyboard step is a gate: show `storyboard.html`, wait for an explicit yes for *this* film, then build |
| Generated palette/voice trusted as-is | `brand_kit.py` reads site CSS and copy only: check it against 5-8 Instagram posts with `palette.py` before it goes in `STYLE.md` |
| `git clone` "File name too long" (Windows) | clone/render into a short path |
| `python -I` → no numpy | user-site install: run without `-I` |
| Loop over a URL list fails silently | strip `\r` from files written by Python on Windows |

## Honesty

Real brand photos, names and claims = **private test or spec pitch**, never posted as the brand's ad. Claims only from the brand's own pages, footnoted ("*brand claim, site.com"). Stock footage/music: Mixkit free licence; credit the track in the delivery note.
