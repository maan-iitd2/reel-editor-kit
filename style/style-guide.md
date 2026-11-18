# Style guide: "Editorial green" (default style)

Measured from justyn.ai's reels (research/dissection.md §2–4). These are his values,
so use them to learn the system, then **change the hex values and fonts to your own brand**
before you post. His own advice: "build a brand style guide… this is your personal preference."

## Brand tokens

| Token | His value (measured) | Yours | Use |
|---|---|---|---|
| `--green` | `#163227` | | flat hook background, panels, dashboard |
| `--caption-box` | `#21372C` | | box behind captions |
| `--cream` | `#F0F4E9` | | titles, spoken caption words, done rows |
| `--gold` | `#BFAB6D` | | ONE accent word per title, "+40 more" badge |
| `--label` | `#9AA27C` | | small mono caps labels |
| `--muted` | `#8FA399` | | upcoming caption words, upcoming dashboard rows |
| `--pill` | `#FDFDFD` on black text | | current row, white title pills |
| `--red` | strike / stamp red | | strikes, "BAD TAKE", grease pencil, nothing else |

| Role | Close match (free) | Use |
|---|---|---|
| Display serif, tall | Instrument Serif / Playfair Display | words behind the head, mastheads |
| Heavy grotesk | Archivo Black / Inter Black | punch phrases ("A SINGLE SECOND") |
| Italic serif | Instrument Serif Italic | the accent half ("Claude *did.*") |
| Mono | JetBrains Mono | labels, timecodes, counters |
| UI sans | Inter 600/700 | prompt bars, dashboard, comment boxes |

## Rules

- **Hook (0–3 s):** cut yourself out over flat `--green`, with type behind your head. Use 3 type styles in
  3 s (serif → grotesk → italic serif), the accent word in `--gold`, and a running mono timecode under
  the grotesk line.
- **Captions:** ~52 px serif (at 1080 wide), 2–4 words, on a `--caption-box` box at chest height
  (~70% down). Spoken words are `--cream` and upcoming ones `--muted` (karaoke). Captions never get
  big; emphasis is a separate type moment above or behind the head.
- **One visual change about every 1 s** in format A/B. Every effect illustrates the exact words
  being said (say "no CapCut" → CapCut icon struck). No decoration.
- **Proof on screen:** show the process as UI: a "TO CLAUDE" prompt bar typing the instruction,
  the storyboard doc, the timeline, file cards.
- **Grade:** warm and dark, with practical lamps and deep shadows. "Moody" is a single grade change you can say out loud.
- **Motion:** springs only (motion-design presets); UI 320/30, panels 170/26, heavy type 120/24.
- **CTA card:** a comment box that types the keyword, with "Comment "EDIT" and I'll send you …" above it.

## Other styles

He runs 3 styles. Add yours as `style/<name>.md` with the same token table, then name the
style in each video's `brief.md`. The battle reel (DflSIzduyab) shows two more looks:
red/white tabloid poster, and black/white newsprint.

## Learned (append after each video)

-
