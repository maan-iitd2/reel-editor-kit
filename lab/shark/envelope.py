"""wav -> mouth-open curve (0..1 per video frame) for the shark rig's cfg["mouth"].
  python envelope.py voice.wav cfg.json [fps]   (writes cfg["mouth"] and cfg["duration"] if missing)
Fast attack, slower release, so the jaw snaps open on syllables and eases shut. Needs numpy + ffmpeg.
"""
import json, subprocess, sys
import numpy as np


def envelope(x, sr, fps):
    hop = sr // fps
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop + 1, hop)])
    if not len(rms): return []
    db = 20 * np.log10(rms + 1e-6)
    lo, hi = np.percentile(db, 20), np.percentile(db, 97)
    v = np.clip((db - lo - 6) / max(1e-6, hi - lo - 6), 0, 1)
    out, cur = [], 0.0
    for a in v:  # attack 0.7 / release 0.35 per frame
        cur += (a - cur) * (0.7 if a > cur else 0.35)
        out.append(round(float(cur), 3))
    return out


if __name__ == "__main__":
    sr = 16000
    x = np.zeros(sr, np.float32); x[4000:8000] = 0.5 * np.sin(np.arange(4000) / 3)
    e = envelope(x, sr, 30)
    assert max(e[:7]) < 0.05 and max(e[8:15]) > 0.8 and e[-1] < 0.05, e
    if len(sys.argv) > 2:
        wav, cfgp = sys.argv[1], sys.argv[2]; fps = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", wav, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                         capture_output=True, check=True).stdout, np.float32)
        cfg = json.load(open(cfgp)); cfg["mouth"] = envelope(x, sr, fps)
        cfg.setdefault("duration", round(len(x) / sr + 0.5, 2))
        json.dump(cfg, open(cfgp, "w"), indent=1)
        print(f"{len(cfg['mouth'])} frames -> {cfgp}")
