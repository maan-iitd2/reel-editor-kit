# Dissection of justyn.ai's reels

Source: the 76 reels in `references/videos`. Visuals come from contact sheets
(`research/frames/`, 1 fps plus 4 fps for the first 6 s) and colours sampled from the pixels.
Script and pacing numbers come from `research/analyze.py` (`research/analysis/summary.csv`).

## 1. He uses three formats, and each one has a fixed recipe

| Format | Example | Recipe |
|---|---|---|
| **A. Story/claim talking head** | DeUUFJQu8cw (2.3M views, 48 s) | Hook claim in 3 type styles over a cut-out on flat green → shot in 4–5 setups (rooms, outfits, angles) → a new visual every ~1 s → proof (UI of the process: prompts, storyboard, timeline) → CTA comment box |
| **B. Effects showcase + dashboard** | Dfcr8TJMKCV (top likes, 8.9K), De4UDEqM1f5 | One static seated shot. The **right-side dashboard** lists every effect, and a new effect fires every ~1 s for 20 s. White pill title top-left. Ends on a full-frame print piece (newspaper "The Daily Reel", banknote) |
| **C. Battle/reaction** | DflSIzduyab, DfxScFyMSBo | Two phone mock-ups playing side by side at the top (Opus vs Fable), him below reacting while holding a phone, a "Drop your vote below" pill, comments as the CTA |

He also **reposts the same edit several times** (identical captions on Nov 7–8 and Nov 11), which looks like testing hooks and thumbnails.

## 2. Measured palette (sampled from his frames)

| Token | Hex | Where |
|---|---|---|
| Brand green | `#163227` | dashboard panel, flat hook background (identical in both) |
| Caption box | `#21372C` | box behind the captions |
| Cream | `#F0F4E9` | titles, caption text (`#E8F7ED`), done rows |
| Gold | `#BFAB6D` | accent word ("Claude **did.**"), "+40 more effects" badge |
| Olive label | `#9AA27C` | small mono caps labels ("IN THIS VIDEO") |
| Muted row | `#8FA399` / numbers `#778E84` | upcoming dashboard rows |
| Pill | `#FDFDFD` with black text | current dashboard row, white title pills |
| Red | strike lines and stamps | icon strike, "BAD TAKE", grease pencil |

The footage is graded warm and dark: tungsten lamps, dark green walls. The graphics stay on the green/cream/gold palette.

## 3. Typography (by eye; check against the fonts you license)

- **Display serif, condensed and tall:** "I DIDN'T EDIT", "NEVER", "HUG" set *behind his head* (cut-out over type). Close match: *Instrument Serif* / *Playfair Display SC* condensed.
- **Heavy grotesk, tight:** "A SINGLE SECOND OF THIS VIDEO.", "BIGGER". Close match: *Inter Display Black* / *Archivo Black*.
- **Italic serif accent:** "Claude *did.*", "*captions.*", "*20 seconds.*". Close match: *Instrument Serif Italic*.
- **Mono:** labels, timecodes (`00:00:01:18` running under the hook), counters. Close match: *JetBrains Mono*.
- **UI sans:** prompt bars, dashboard rows, comment boxes. Close match: *Inter* semibold.
- The hook uses **three type styles in 3 seconds**: serif → grotesk → italic serif.

## 4. Captions

- Small, not "Hormozi" style: about 52 px serif on a 1080-wide frame, cream on a `#21372C` box, at chest height (~70% down).
- 2–4 words at a time. **Words not yet spoken show dimmed** (green-tinted), and spoken words turn cream (karaoke).
- For emphasis, a separate big type moment appears above or behind the head. The caption itself never gets big.

## 5. Effects seen (on top of the 20 in the catalog)

From the dashboard reel (Dfcr8TJMKCV): live cursor (selection box with a "Claude" cursor
label and pixel size), clone row, day dial, predict keys, orbit ring, code body (ASCII
version of him), post wall, letter dive, layer explode (3D-split layers TYPE / LIST / SOUND / ROOM
with a waveform), sketch words, blade slice, head stack, rack focus, banknote ("AI VIDEO
EDITING MASTERCLASS" bill with his portrait), voice note, impact frame (manga speed lines +
"IMPACT"), dolly zoom, press front (newspaper "The Daily Reel"), paper tear, blow away.

From the flagship (DeUUFJQu8cw): background removal onto flat brand green, type behind the head,
icon strike over the CapCut and Edits logos, a "TO CLAUDE" prompt bar that types the instruction then
shows a ✓ "edited", a magazine masthead behind his head with a barcode, NLE timeline, file card
(`…C30F.MP4`), "BAD TAKE" tape stamps with "1:16 of raw footage", a giant timer "0:54", a grid
of other creators' reels ("And lots of people"), Claude's storyboard document as proof, chat
bubbles, a grade change on "the colours go dark", and a YouTube-style card for the walkthrough.

**Pattern:** every effect *illustrates the exact words being said* ("no CapCut" → CapCut icon
struck through; "make it moody" → grade goes dark). Nothing is decorative.

## 6. Production

- Shot on a good camera with a lav mic, warm practical lamps, a dark green room with framed art.
  A cap and a patterned jacket or hoodie are his signature look.
- Format A changes location/outfit 4–5 times in one reel, so every setup change is a free pattern-interrupt.
- His CTA is always the same: comment a keyword ("EDIT", "TRIAL") and he DMs the link (ManyChat-style
  automation), with "link in bio" as the fallback.

## 7. His setup, in his own words (from the transcripts)

- "You install the **plugin** that I built. You add in your own **brand guidelines** or just create one from
  scratch… Then you add in a couple **inspo videos** and then just drop in the footage you've recorded.
  And Claude or ChatGPT will handle the rest. It comes loaded with **three different styles, 40 different
  effects**. You can even add your own effects… And then you can just **one click send everything to trial
  reels**." — [DfVQbnVPwg9](https://www.instagram.com/reel/DfVQbnVPwg9/)
- "Before rendering, it gives me a **complete storyboard**. So I can see what Claude is thinking before it
  creates my video… Tighter cut, bigger captions, that's just one more sentence." — [DeUUFJQu8cw](https://www.instagram.com/reel/DeUUFJQu8cw/)
- ChatGPT version: a folder with the video goes into a ChatGPT project → explain the edits, give inspo, or both →
  "using Sites, you get a fully **interactive storyboard**" → render → **multiple versions** → upload to
  **trial reels** → "a breakdown 24 hours later as to which videos are performing best and why." — [DfkdmR5Mkc8](https://www.instagram.com/reel/DfkdmR5Mkc8/)
- His 3-step method: (1) 3–5 inspo videos (transitions, colours, SFX, captions); (2) have the AI build a
  **brand style guide** (colour + typography); (3) drop in the raw video, "edit it based on your inspo and your
  brand kit", then keep adapting: "day 100 will always be better than day one." — [DfnVtk0PYXe](https://www.instagram.com/reel/DfnVtk0PYXe/)
- "The more that you sprinkle in your personality, the better the results." He once had Claude cut to a
  trending sound from a link. — [DfCx2vHMb65](https://www.instagram.com/reel/DfCx2vHMb65/)

## 8. Script formula (52 unique scripts, 76 reels)

**Numbers:** median 41 s, ~186 words, **~244 wpm** (fast; almost certainly gaps cut out),
speech covers **92% of runtime**, first word at **0.0 s** (no intro, no breath). The effects-list reels
are the exception: they're about 25 s at ~120 wpm, just reading effect names out over the dashboard.

**Hook (first sentence, 0–3 s).** It always works as a statement on its own. The types he repeats:
| Type | His lines |
|---|---|
| Proof-in-the-video claim | "I didn't edit a single second of this video. Claude did." (used 5+ times) |
| Contrarian reframe | "If AI edits your videos and they look like everybody else's… that's a you problem." |
| Question with two visuals | "If Claude edited both of these videos, then why is this one so much better than this one?" |
| Admission / twist | "Okay, I admit it, I was wrong." · "There are a couple major problems with this." |
| Outcome promise | "You can go from raw video to multiple edits… without knowing a single thing about video editing." |
| Social proof number | "Over four and a half million of you have seen it." · "This many people bought…" |
| Pattern break | "Ugh, this guy again." · "This is my wife and…" |

**Body:** the proof is shown on screen while he says it ("Watch, I tell Claude, make it more aesthetic").
Then it's either *numbered steps* ("Step one… step two… number three, the most important") or *objection →
reframe* ("it's a skill-gap issue", "different tastes, and that's okay"). Sentences are short and conversational,
with a twist in the middle ("But here's the twist").

**CTA (always, last ~8 s):** comment a keyword → DM ("just drop EDIT in the comments below and I'll send it
over"), then a follow line ("make sure to follow me for more daily AI tips just like this").
Launch reels add urgency ("doors reopen in 24 hours").

**Volume:** 76 reels in ~5 weeks, often several a day, with the same edit reposted as tests.
