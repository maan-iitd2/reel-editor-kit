"""One entry point for the three stages a human actually invokes."""
import sys
from pathlib import Path

USAGE = """roughcut <command>

  probe   [takes_dir] [out_dir]        metadata, frames and transcripts
  build   [plan] [takes_dir] [out]     shot plan -> master.mp4
  caption <video> [out] [style]        re-transcribe and burn captions
          styles: hormozi mrbeast classic karaoke minimal bounce
  music   [music_dir] [index]          scan the library, tag new tracks
  ui      [port]                       open the browser UI (recommended)
  search  <query>                      semantic footage search (needs probe first)
  scenes  <video>                      detect shot cuts

Between probe and build, Claude reads clips.json plus frames/ and writes
shotplan.md. You approve that file. That is the only manual step.
"""


def main(argv=None) -> int:
    argv = list(argv if argv is not None else sys.argv[1:])
    if not argv or argv[0] in ("-h", "--help"):
        print(USAGE)
        return 0
    cmd, rest = argv[0], argv[1:]
    from .probe import require_ffmpeg
    require_ffmpeg()
    if cmd == "probe":
        from .probe import probe_all
        r = probe_all(rest[0] if rest else "takes",
                      rest[1] if len(rest) > 1 else ".")
        print(f"{len(r['clips'])} clips -> clips.json")
    elif cmd == "build":
        from .build import build_video
        from .shotplan import parse_plan
        plan_path = Path(rest[0] if rest else "shotplan.md")
        if not plan_path.exists():
            print(f"no such plan file: {plan_path}")
            return 2
        out = build_video(parse_plan(plan_path.read_text(encoding="utf-8")),
                          rest[1] if len(rest) > 1 else "takes",
                          rest[2] if len(rest) > 2 else "master.mp4")
        print(out)
    elif cmd == "caption":
        from .caption import caption_file
        if not rest:
            print("caption needs a video path")
            return 2
        print(caption_file(*rest))
    elif cmd == "ui":
        from .ui import serve
        serve(int(rest[0]) if rest else 8000)
    elif cmd == "search":
        if not rest:
            print("search needs a query")
            return 2
        import json as _json
        from .clipsearch import search
        idx_path = Path("clip_index.json")
        if not idx_path.exists():
            print("no clip_index.json — run `probe` first")
            return 2
        for h in search(" ".join(rest), _json.loads(idx_path.read_text(encoding="utf-8"))):
            print(f"  {h['score']:.3f}  {h['file']} @ {h['t']}s")
    elif cmd == "scenes":
        if not rest:
            print("scenes needs a video path")
            return 2
        from .scenes import detect_cuts
        cuts = detect_cuts(rest[0])
        print(f"{len(cuts)} cuts: " + ", ".join(f"{c:.2f}s" for c in cuts))
    elif cmd == "music":
        from .music import scan
        tracks = scan(rest[0] if rest else "music",
                      rest[1] if len(rest) > 1 else "music.md")
        print(f"{len(tracks)} tracks in the library")
    else:
        print(f"unknown command {cmd!r}\n\n{USAGE}")
        return 2
    return 0


def _selfcheck() -> None:
    assert main([]) == 0                              # usage, clean exit
    assert main(["--help"]) == 0
    assert main(["bogus"]) == 2                       # unknown command
    assert main(["caption"]) == 2                     # missing video path
    assert main(["build", "definitely_not_here.md"]) == 2   # missing plan file
    print("cli selfcheck OK")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--selfcheck":
        _selfcheck()
    else:
        raise SystemExit(main())
