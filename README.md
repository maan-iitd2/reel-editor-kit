# Content Creation: justyn.ai-style reel editing

> **Start here:** read [PROMPTING.md](PROMPTING.md) first. It's how to prompt Claude for
> good-looking edits, and it matters more than any code in here.
>
> **Setting up on your own PC:** this was built on Maan's machine, so `CLAUDE.md` has his paths
> (`C:\VOLUME_D\...`). Install [Claude Code](https://claude.com/claude-code), ffmpeg, Node and
> Python 3.11+, open Claude Code in this folder and paste:
>
> ```
> Set this repo up on my machine. Install tools/roughcut/requirements.txt in a venv and
> Playwright for Python, copy skills/motion-design and skills/making-brand-films into
> ~/.claude/skills, then update every path in CLAUDE.md and README.md to match my machine.
> Verify by transcribing a 10-second test clip and rendering one effect from effects/lib.
> ```
>
> Not in the repo (too big or not ours to share): raw footage, renders, and the downloaded
> reference reels. `references/download.sh` re-downloads them from `references/reel_ids.txt`
> (needs yt-dlp). A GPU makes transcription fast but isn't required.

Talking-head footage in, a finished editorial-style reel out. Claude does the edit.
Modeled on @justyn.ai, who edits every reel inside Claude and ChatGPT using an
effects library plus a style guide. Read [research/setup-notes.md](research/setup-notes.md)
for what he actually says and what's inferred.

## How it fits together

| Piece | His version | Ours |
|---|---|---|
| Editor | Claude / ChatGPT | Claude Code in this folder ([CLAUDE.md](CLAUDE.md) = orchestrator rules) |
| Cuts + transcript | not stated | your `roughcut` (faster-whisper large-v3 on GPU, word timestamps) |
| Effects | "60+ effects built by Claude" | [effects/catalog.md](effects/catalog.md), built with your `motion-design` skill (HTML `seek(t)` + springs → Playwright → ffmpeg, same engine as the D'YOU films) |
| Style | his style guide / brand kit | [style/style-guide.md](style/style-guide.md) (edit the tokens) |
| Repurposing | 1 video → 7+ pieces | [prompts/repurpose.md](prompts/repurpose.md) |
| References | — | [references/](references/index.md): all 76 reachable reels, downloaded |
| What he actually does | — | [research/dissection.md](research/dissection.md): formats, measured palette, captions, pacing, his setup in his own words, script formula |
| Scripts | his hook → proof/steps → keyword CTA formula | [prompts/script.md](prompts/script.md) |

## Make a video

1. Copy `videos/_template` to `videos/2026-11-20-my-topic`, fill in `brief.md`.
2. Record one continuous take. Pause between lines, restart whole sentences, and the
   last take wins. Drop the file in `raw/`, plus any screen recordings in `broll/`.
3. Open Claude Code in this folder and paste the "Edit a video" prompt from
   [prompts/edit.md](prompts/edit.md).
4. Approve the shotplan, review the final, and say what to change.
   Things you liked go into the style guide's "Learned" section.

## One-time setup checklist

- [x] ffmpeg 8.1, Node 24, Python venv with faster-whisper (already on this PC)
- [x] roughcut at `C:\VOLUME_D\Ideas\roughcut` (checked: CLI runs from here)
- [x] Motion engine: `motion-design` + `making-brand-films` skills (already installed) and
      `C:\Python314\python.exe` with Playwright (checked: spring test frames render)
- [x] HyperFrames plugin 0.9.61 for Claude Code (user scope): `/hyperframes`,
      `/hyperframes-registry` (450 ready-made blocks), `/reverse-any-video`, `/media-use`
- [x] yt-dlp 2026.10.26 in the shared venv. `references/download.sh` re-downloads anything new
      from `references/reel_ids.txt`. 76 reels so far (1.1 GB).
- [ ] Fonts: Instrument Serif, Anton, Inter, Caveat, JetBrains Mono (free, Google Fonts)
- [ ] Optional: the Epidemic Sound MCP for music (paid subscription)
- [ ] Optional: comment "EDIT" on [his reel](https://www.instagram.com/justyn.ai/reel/DeUUFJQu8cw/) to get his free walkthrough, then add what's in it to the style guide

Rules worth keeping: never install torch into the shared venv (Smart App
Control blocks it; see `C:\VOLUME_D\Ideas\README.md`).
