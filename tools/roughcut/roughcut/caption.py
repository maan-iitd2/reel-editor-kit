"""Burned-in karaoke captions.

ASS rather than SRT because SRT cannot do per-word highlighting, which is the
entire look. In ASS karaoke, text starts in SecondaryColour and flips to
PrimaryColour as each \\k interval elapses — so Primary is the highlight.

Two generators live here. `to_ass(words)` is the plain \\k karaoke: one
Dialogue per line, cheap, and all libass can express with karaoke tags alone.
`to_ass(words, style="hormozi")` is the VEED-style dynamic look: one Dialogue
*per word*, each redrawing the whole line with only the active word tagged.
That costs more events but is the only way to animate a single word — \\k can
recolour, it cannot scale, bounce or transform.

Per-word-event technique and the style presets adapted from
https://github.com/nicolaigaina/ai-video-captions (MIT), backend/subtitles.py
and caption-styles.config.json.
"""
from .timefmt import ass_time

CHUNK = 4            # words per caption line; 3-5 reads as punchy, 8 as a wall
FONT = "Arial"       # ponytail: guaranteed present on Windows. Swap for a brand
                     # face once one is chosen, and ship the .ttf alongside.
FONT_SIZE = 64
MARGIN_V = 130       # px off the bottom at 1080p (~12%), clears YouTube's
                     # progress bar and control overlay
PRIMARY = "&H0000FFFF"    # yellow: the highlighted (already spoken) word
SECONDARY = "&H00FFFFFF"  # white: not yet spoken
OUTLINE_COL = "&H00000000"
BACK_COL = "&H80000000"

_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,{font},{size},{pri},{sec},{out},{back},{bold},{italic},0,0,100,100,{fsp},0,1,{outline},{shadow},2,60,60,{mv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

# ponytail: fonts are the ones Windows ships, so a fresh clone renders right
# with no install. Montserrat/Anton/Bebas Neue are the real social-video faces —
# drop the .ttf next to this file and swap the name when brand fonts are picked.
#
# anim: flat = recolour only, grow = hold at 110%, pop = overshoot then settle,
# wipe = \kf colour sweep across the word.
STYLES = {
    "hormozi":  dict(font="Impact", size=76, primary="#FFFFFF", highlight="#00FFFF",
                     outline=5, shadow=4, anim="pop",  upper=True),
    "mrbeast":  dict(font="Impact", size=80, primary="#FFFF00", highlight="#FF6600",
                     outline=7, shadow=0, anim="pop",  upper=True),
    "classic":  dict(font="Arial Black", size=68, primary="#FFFFFF", highlight="#FFFF00",
                     outline=5, shadow=3, anim="flat", upper=True),
    "karaoke":  dict(font="Arial Black", size=68, primary="#FFFFFF", highlight="#0080FF",
                     outline=4, shadow=3, anim="wipe", upper=False),
    "minimal":  dict(font="Bahnschrift", size=64, primary="#FFFFFF", highlight="#F5F5F5",
                     outline=3, shadow=2, anim="grow", upper=False, italic=True, fsp=3),
    "bounce":   dict(font="Arial Black", size=72, primary="#00FF88", highlight="#FF00FF",
                     outline=5, shadow=5, anim="pop",  upper=True),
}
MIN_EVENT = 0.04     # ~1 frame at 25fps; a zero-length event never renders


def chunk_words(words: list, size: int = CHUNK) -> list:
    return [words[i:i + size] for i in range(0, len(words), size)]


def _ass_colour(hexrgb: str) -> str:
    """#RRGGBB -> &HAABBGGRR. ASS stores colour byte-reversed, opaque = 00."""
    h = hexrgb.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"expected #RRGGBB, got {hexrgb!r}")
    int(h, 16)                       # reject non-hex before it reaches libass
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}"


def _active(word: dict, st: dict) -> str:
    """The one word being spoken, wrapped in its animation. `\\r` reverts the
    rest of the line to the style, so tags cannot leak into later words."""
    col = _ass_colour(st["highlight"])
    anim = st["anim"]
    if anim == "pop":
        # \t times are ms from this event's start, and the event starts on the
        # word — so the overshoot lands exactly when the word is said.
        tag = f"\\t(0,80,\\fscx118\\fscy118)\\t(80,160,\\fscx100\\fscy100)\\c{col}"
    elif anim == "grow":
        tag = f"\\fscx110\\fscy110\\c{col}"
    elif anim == "wipe":
        # \kf sweeps SecondaryColour -> PrimaryColour; \c moves Primary to the
        # highlight, so the sweep runs base -> highlight across this word.
        cs = max(1, int(round((word["end"] - word["start"]) * 100)))
        tag = f"\\kf{cs}\\c{col}"
    else:
        tag = f"\\c{col}"
    return "{%s}%s{\\r}" % (tag, _text(word, st))


def _text(word: dict, st: dict) -> str:
    body = _clean(word["word"])
    return body.upper() if st.get("upper") else body


def _dynamic(words: list, width: int, height: int, chunk: int, st: dict) -> str:
    """One Dialogue per word, each redrawing the full line."""
    parts = [_HEADER.format(
        w=width, h=height, font=st["font"], size=st["size"],
        # Primary and Secondary both hold the base colour: Primary paints the
        # idle words, Secondary is where a \kf wipe starts from.
        pri=_ass_colour(st["primary"]), sec=_ass_colour(st["primary"]),
        out=OUTLINE_COL, back=BACK_COL,
        bold=-1, italic=-1 if st.get("italic") else 0, fsp=st.get("fsp", 0),
        outline=st["outline"], shadow=st["shadow"], mv=MARGIN_V)]
    for group in chunk_words([w for w in words if w["word"].strip()], chunk):
        for i, w in enumerate(group):
            start = w["start"]
            # Hold the line until the next word takes over, so pauses between
            # words do not blink the caption off.
            nxt = group[i + 1]["start"] if i + 1 < len(group) else group[-1]["end"]
            end = max(nxt, start + MIN_EVENT)
            line = " ".join(_active(x, st) if j == i else _text(x, st)
                            for j, x in enumerate(group))
            parts.append(
                f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Pop,,0,0,0,,{line}\n")
    return "".join(parts)


def _clean(word: str) -> str:
    """Neutralise ASS control characters.

    `{` and `}` delimit override blocks and `\\N` is a line break; Whisper
    occasionally emits both. libass escape handling is inconsistent across
    builds, so substitute rather than escape.
    """
    return (word.replace("{", "(").replace("}", ")").replace("\\", "/")
                .replace("\r", " ").replace("\n", " ").strip())


def to_ass(words: list, width: int = 1920, height: int = 1080,
           chunk: int = CHUNK, style: str = "") -> str:
    """Word list -> a complete .ass file. Words are {word,start,end}.

    `style` picks a STYLES preset and the per-word dynamic renderer; empty
    means the plain \\k karaoke below.
    """
    if style:
        if style not in STYLES:
            raise ValueError(f"unknown style {style!r}; have: {', '.join(STYLES)}")
        return _dynamic(words, width, height, chunk, STYLES[style])
    parts = [_HEADER.format(w=width, h=height, font=FONT, size=FONT_SIZE,
                            pri=PRIMARY, sec=SECONDARY, out=OUTLINE_COL,
                            back=BACK_COL, bold=-1, italic=0, fsp=0,
                            outline=4, shadow=2, mv=MARGIN_V)]
    for group in chunk_words([w for w in words if w["word"].strip()], chunk):
        start, end = group[0]["start"], group[-1]["end"]
        text = ""
        prev_end = start
        for w in group:
            # \k intervals are sequential offsets from the line's start, so a
            # pause between words needs its own interval too. Without it every
            # later highlight fires early and the drift accumulates.
            gap = int(round((w["start"] - prev_end) * 100))
            if gap > 0:
                text += "{\\k%d}" % gap
            # Centiseconds, integer. Never 0, or libass highlights the whole
            # line at once.
            cs = max(1, int(round((w["end"] - w["start"]) * 100)))
            text += "{\\k%d}%s " % (cs, _clean(w["word"]))
            prev_end = w["end"]
        parts.append(
            f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Pop,,0,0,0,,{text.strip()}\n"
        )
    return "".join(parts)


def _selfcheck() -> None:
    words = [{"word": "So", "start": 0.0, "end": 0.30},
             {"word": "today", "start": 0.30, "end": 0.70},
             {"word": "we", "start": 0.70, "end": 0.85},
             {"word": "build", "start": 0.85, "end": 1.35},
             {"word": "this", "start": 1.35, "end": 1.70}]

    assert [len(g) for g in chunk_words(words, 4)] == [4, 1]

    ass = to_ass(words, 1920, 1080, chunk=4)
    assert "[Script Info]" in ass and "PlayResX: 1920" in ass
    assert f"Style: Pop,{FONT},{FONT_SIZE}," in ass
    assert f",{MARGIN_V},1" in ass          # margin is set once, in the style
    lines = [l for l in ass.splitlines() if l.startswith("Dialogue:")]
    assert len(lines) == 2, lines

    first = lines[0]
    assert first.startswith("Dialogue: 0,0:00:00.00,0:00:01.35,Pop,"), first
    # Karaoke intervals must sum to the line's own duration.
    import re
    ks = [int(x) for x in re.findall(r"\\k(\d+)", first)]
    assert ks == [30, 40, 15, 50], ks
    assert sum(ks) == 135, sum(ks)
    # Strip the \k tags to recover the spoken text. Brace-replacement would
    # leave the tag bodies behind and never match.
    assert re.sub(r"\{\\k\d+\}", "", first).endswith("So today we build"), first

    # A zero-length word must still produce a usable interval.
    z = to_ass([{"word": "x", "start": 1.0, "end": 1.0}])
    assert "\\k1}" in z, z
    # Blank tokens are dropped rather than emitted as empty karaoke.
    b = to_ass([{"word": "  ", "start": 0.0, "end": 1.0}])
    assert "Dialogue:" not in b

    # A pause between words needs its own \k, or later highlights fire early.
    gapped = to_ass([{"word": "a", "start": 0.0, "end": 0.20},
                     {"word": "b", "start": 0.70, "end": 1.00}])
    gline = [l for l in gapped.splitlines() if l.startswith("Dialogue:")][0]
    gks = [int(x) for x in re.findall(r"\\k(\d+)", gline)]
    assert gks == [20, 50, 30], gks
    # The intervals must span the line's full duration, gaps included.
    assert sum(gks) == 100, gks

    # ASS override delimiters must not survive into the output.
    dirty = to_ass([{"word": "{bad}", "start": 0.0, "end": 0.5}])
    assert "{bad}" not in dirty and "(bad)" in dirty, dirty

    _selfcheck_dynamic(words)
    print("caption selfcheck OK")


def _selfcheck_dynamic(words: list) -> None:
    import re

    assert _ass_colour("#00FFFF") == "&H00FFFF00"      # cyan: BGR, not RGB
    assert _ass_colour("#FF6600") == "&H000066FF"
    try:
        _ass_colour("#GGGGGG")
        raise AssertionError("bad hex must not reach libass")
    except ValueError:
        pass

    for name in STYLES:
        assert to_ass(words, style=name).startswith("[Script Info]"), name
    try:
        to_ass(words, style="nope")
        raise AssertionError("unknown style must raise")
    except ValueError:
        pass

    ass = to_ass(words, 1920, 1080, chunk=4, style="hormozi")
    assert "Style: Pop,Impact,76," in ass, ass
    lines = [l for l in ass.splitlines() if l.startswith("Dialogue:")]
    # One event per word, not per line: 4 words in group one, 1 in group two.
    assert len(lines) == 5, len(lines)

    # Every event carries the whole line; exactly one word is animated.
    for l in lines[:4]:
        assert l.count("{\\r}") == 1, l
        body = re.sub(r"\{[^}]*\}", "", l.split(",,")[-1])
        assert body == "SO TODAY WE BUILD", body        # upper=True applies
    assert "\\t(0,80,\\fscx118\\fscy118)" in lines[0]

    # Event i runs until word i+1 starts, so a pause holds the line on screen
    # instead of blinking it off.
    assert lines[0].startswith("Dialogue: 0,0:00:00.00,0:00:00.30,"), lines[0]
    assert lines[3].startswith("Dialogue: 0,0:00:00.85,0:00:01.35,"), lines[3]

    # A word with no duration still gets a renderable event.
    z = [l for l in to_ass([{"word": "x", "start": 1.0, "end": 1.0}],
                           style="hormozi").splitlines()
         if l.startswith("Dialogue:")]
    assert z[0].startswith("Dialogue: 0,0:00:01.00,0:00:01.04,"), z[0]

    # The wipe style must emit a \kf sized to the word it sits on.
    k = to_ass(words, style="karaoke")
    assert "\\kf30\\c&H00FF8000}So{\\r}" in k, k

    # Braces from a hallucinated transcript must not open an override block.
    d = to_ass([{"word": "{bad}", "start": 0.0, "end": 0.5}], style="hormozi")
    assert "{BAD}" not in d and "(BAD)" in d, d


def burn(video, out, words: list, chunk: int = CHUNK, style: str = ""):
    """Burn karaoke captions onto the video. Loudness is untouched here."""
    import subprocess, tempfile
    from pathlib import Path

    video, out = Path(video), Path(out)
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", "-select_streams", "v:0", str(video)],
        capture_output=True, text=True, check=True)
    import json
    streams = json.loads(probe.stdout)["streams"]
    if not streams:
        raise SystemExit(f"{video} has no video stream")
    st = streams[0]
    w, h = int(st["width"]), int(st["height"])

    with tempfile.TemporaryDirectory() as td:
        ass = Path(td) / "captions.ass"
        ass.write_text(to_ass(words, w, h, chunk, style), encoding="utf-8")
        # libass wants forward slashes; the drive colon and any quote must be
        # escaped, and the whole value quoted so commas and spaces in the path
        # cannot split the filtergraph.
        esc = str(ass).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
        filt = f"subtitles='{esc}'"
        # Loudness is build.py's job; normalising here would be a second pass.
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(video),
             "-vf", filt,
             "-c:v", "libx264", "-crf", "18", "-preset", "medium",
             "-c:a", "aac", "-b:a", "192k", str(out)],
            check=True)
    return out


def caption_file(video, out="", style=""):
    """Re-transcribe a rendered video and burn its own captions onto it."""
    from pathlib import Path
    from .stt import transcribe
    video = Path(video)
    out = Path(out) if out else Path.cwd() / (video.stem + "_captioned.mp4")
    return burn(video, out, transcribe(video), style=style)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] != "--selfcheck":
        print(caption_file(*sys.argv[1:]))
    else:
        _selfcheck()
