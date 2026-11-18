# How to prompt Claude for good-looking edits

The short version: **the model matters less than what you give it.** justyn.ai, whose
reels this kit copies, says it straight: it's not the model, it's "the context and style
guide" it has. Anthropic says the same about design: without guidance Claude drifts to safe,
generic output, the most average answer from everything it has seen. Every rule below is a way
to push it off that average.

Sources are at the bottom. "He" = justyn.ai unless noted.

---

## 1. Give it context once, not in every prompt

Don't write a long prompt every time. Put the taste in files Claude reads every session.

| File | What goes in it | This repo |
|---|---|---|
| Rules file | how to edit: cut rules, pacing, checks before showing you | [CLAUDE.md](CLAUDE.md) |
| Style guide | your colours (hex), fonts, caption look, motion rules, what you liked last time | [style/style-guide.md](style/style-guide.md) |
| Effects catalog | each effect, and **when** to use it (what words trigger it) | [effects/catalog.md](effects/catalog.md) |
| Brief | one per video: goal, hook, CTA, notes | `videos/<folder>/brief.md` |
| Inspo | 3-10 reels you want to look like | `references/` |

His 3 steps: (1) collect inspo reels, (2) write a brand style guide (colour + type),
(3) drop in the raw video and say "edit it based on your inspo and your brand kit". Then keep
adapting. In his words: day 100 will always be better than day one.

**Then your prompt can be short:**

```
Edit videos/2026-11-20-my-topic. Follow CLAUDE.md. Goal: followers.
Show me the shotplan and storyboard before you render.
```

## 2. Say what "better" means. Never just "make it better"

Vague: *"make it look cool"*. Claude has to guess, and its guess is the average.

Specific, and it lands:

- **Typography:** name the fonts and the job of each. *"Tall condensed serif for the hook words
  behind my head, heavy grotesk for punch phrases, italic serif for one accent word."*
- **Colour:** one dominant colour plus one sharp accent beats five evenly spread colours.
  Put the hex codes in the style guide, then just say *"use the style guide palette"*.
- **Motion:** *"springs only, small overshoot, no linear fades, no bounce"*.
- **Pace:** *"a new visual about every 1 s, a cut every ~6 s, clean face shot on the key line and CTA"*.
- **Captions:** size, position, colour. His: small (~52 px on 1080 wide) serif, 2-4 words,
  chest height, karaoke colour on the spoken word. Not giant all-caps.

Use extremes for hierarchy: thin vs black weights, 3x size jumps, not 1.5x. Mild contrast reads
as generic.

## 3. Name what to avoid

Claude's defaults are predictable, so ban them out loud (or in the style guide):

- Fonts: Inter, Roboto, Arial, Open Sans, Lato, system fonts (fine for small UI text, never the look).
- Purple-to-blue gradients on white. Glassy cards everywhere. Emoji as decoration.
- Effects that don't match the words. **Every effect must illustrate what's being said**
  ("no CapCut" → CapCut logo struck out; "make it moody" → grade goes dark). Nothing decorative.
- Cartoon bounces, linear slides, everything fading in at once.

## 4. Reference a look, don't micro-manage it

Point at a world, then let it make choices: *"editorial print: magazine masthead, cream paper
panels, red grease-pencil marks, film grade"* or *"tabloid poster, red and white"*.
That beats both "make it aesthetic" (too vague) and dictating every pixel (no room to be good).

Best of all, show real examples: put reels you like in `references/` and run this **before your
first edit**:

```
Look at the videos in references/. For each one break down: pacing (cuts and effects per 10 s),
the hook in the first 1.5 s, caption style, which effects appear and when, music/SFX, and where
it cuts back to the face. Then update style/style-guide.md and effects/catalog.md with anything
we're missing. Don't touch my footage yet.
```

Claude can't watch video directly; the kit gives it frames + a transcript. So when you describe
footage in a prompt, use timestamps and quote the words ("at 0:12 when I say 'three steps'…").

## 5. Make it plan before it renders

His workflow: "before rendering, it gives me a complete storyboard". Always ask for:

1. a **shotplan** (timestamped script: what's kept, what's cut, which effect on each line), and
2. a **storyboard** (one still per beat on a contact sheet).

Fix things at this stage with one sentence ("tighter cut", "bigger captions on the hook").
Re-rendering is slow; changing a plan is free.

## 6. One change per round, and say what to keep

```
Keep everything the same except: the hook. Make the first 3 s faster and put "NEVER" behind my head.
```

Small, specific rounds converge. "Change a lot of things" rounds go sideways. Do the biggest
problem first (story/cut), then captions, then effects, then music.

## 7. Make versions, then pick (this is how you train taste)

```
Make 4 distinct edits of videos/<folder>: (1) strictly the style guide, (2) more effects, faster,
(3) minimal, captions and punch-ins only, (4) full creative control: impress me.
Render each to out/v1..v4.mp4.
```

Version 4 is his trick: telling it *"forget my brand, full creative control, impress me"* often
surfaces ideas you'd never ask for. Then: *"do more like v2, and add what you learned to the style
guide's Learned section."* Post versions as Instagram trial reels, see which wins after 24 h.

## 8. Ask it to check its own work before you see it

Put the checklist in CLAUDE.md so it runs every time: frame grabs at every effect, captions not
covering mouth/eyes, nothing in the Instagram UI zones (top 220 px, bottom 420 px, right 140 px),
audio in sync, CTA on screen when spoken. Then you only review things that already passed.

## 9. Add your personality

"The more that you sprinkle in your personality, the better the results." Put your jokes, phrases,
things you hate, creators you like into the brief and style guide. That's what stops your edits
looking like everyone else's.

---

## Cheat sheet: the 5 prompts you'll actually use

**Edit**
```
Edit videos/<folder>. Follow CLAUDE.md. Goal: <leads|followers|awareness|sales>.
Show me the shotplan and storyboard before rendering. Only show me the final once your checks pass.
```

**Hook check**
```
Read the transcript of videos/<folder>. Does the hook work alone in 1.5 s?
If not, give me 3 hook lines to record as take 1/2/3.
```

**Fix one thing**
```
Keep everything the same except <one thing>. <What better looks like, specifically.>
```

**Versions**: see §7.

**Learn from it**
```
I picked v<n> because <reason>. Add that to the style guide's Learned section.
```

## What it can and can't do (Aparna's questions)

| Ask | Can it? | How in this kit |
|---|---|---|
| Remove background from a photo/video | Yes | rembg (`birefnet-general` model), cut-out per frame, used for text-behind-head |
| Animations, titles, effects | Yes | HTML + springs rendered to MP4 (`skills/motion-design`, `effects/lib`) |
| Cut silences, bad takes | Yes | `tools/roughcut` (Whisper transcript with word timestamps) |
| Captions | Yes | karaoke captions from the transcript |
| Remove audio noise | Yes, but not built in here | ask Claude to run ffmpeg's `afftdn` / `arnndn` filters, or use DaVinci Resolve's Voice Isolation. Recording in a quiet room with a cheap lav mic beats any filter |

---

## Sources

- justyn.ai reels, quoted from captions/speech, collected in [research/setup-notes.md](research/setup-notes.md) and [research/dissection.md](research/dissection.md) (style guide → [DfxScFyMSBo](https://www.instagram.com/justyn.ai/reel/DfxScFyMSBo/), skill gap → [DfnVtk0PYXe](https://www.instagram.com/justyn.ai/reel/DfnVtk0PYXe/), storyboard → [DeUUFJQu8cw](https://www.instagram.com/justyn.ai/reel/DeUUFJQu8cw/), full creative control → [DflSIzduyab](https://www.instagram.com/justyn.ai/reel/DflSIzduyab/))
- Anthropic, [Prompting for frontend aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) and [Improving frontend design through Skills](https://claude.com/resources/articles/improving-frontend-design-through-skills): guide typography/colour/motion/backgrounds, reference aesthetics, ban defaults
- Justin Brown (Primal Video) via [Social Media Examiner](https://www.socialmediaexaminer.com/how-to-edit-videos-with-ai-no-editing-skills-required/): shoot for the edit, two passes (story then polish), orchestrator that checks sub-agents
- General editing-prompt guides: [invideo](https://invideo.io/blog/video-editing-prompts-claude-chatgpt/), [tella](https://www.tella.com/edit-with-ai/ai-video-editor-prompts) (name the outcome, say what to keep, plan before acting)
