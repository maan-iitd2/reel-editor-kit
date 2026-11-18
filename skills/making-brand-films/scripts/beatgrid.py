"""Find a track's beat grid and its drop, so cuts can sit on beats/bars.
usage: python beatgrid.py song.mp3 [--bpm 60 140] [--drop 10 20] [--secs 30]
Prints onset times, the best-fitting BPM + phase, bar candidates (onsets that repeat at a steady gap: often bars
in 3/4 or 4/4), and with --drop the biggest low-band energy jump inside that window (the drop / swell).
Needs numpy (installed for the motion-design skill). Do not run with `python -I`: it hides user site-packages.
"""
import subprocess, sys
import numpy as np

SR = 22050
a = sys.argv[1:]
song = a[0]
opt = lambda k, d: [float(x) for x in a[a.index(k) + 1:a.index(k) + 3]] if k in a else d
lo, hi = opt("--bpm", [60, 180]); secs = opt("--secs", [30, 0])[0]
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", song, "-t", str(secs), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32)
hop = 256; fps = SR / hop
env = np.array([np.sqrt((x[i:i + hop] ** 2).mean()) for i in range(0, len(x) - hop, hop)])
on = np.convolve(np.maximum(0, np.diff(np.log(env + 1e-6))), np.ones(3) / 3, "same")
pk = [i for i in range(2, len(on) - 2) if on[i] == on[i - 2:i + 3].max() and on[i] > np.percentile(on, 97)]
t = np.array(pk) / fps
print("onsets:", " ".join(f"{v:.2f}" for v in t[:40]))
best = max(((np.cos(2 * np.pi * (t - ph) / (60 / b)).sum(), b, ph) for b in np.arange(lo, hi, 0.05) for ph in np.arange(0, 60 / b, 0.01)))
print(f"grid: {best[1]:.2f} BPM, phase {best[2]:.3f} s  (beat {60 / best[1]:.4f} s)")
if len(t) > 3:
    d = np.diff(t); g = np.median(d[d > 1.0]) if (d > 1.0).any() else 0
    if g: print(f"bar candidate: every {g:.3f} s from {t[0]:.3f} s  (check: onsets near {', '.join(f'{t[0] + k * g:.2f}' for k in range(1, 6))})")
if "--drop" in a:
    w0, w1 = opt("--drop", [0, secs])
    lp = np.convolve(x, np.ones(80) / 80, "same"); w = int(.02 * SR)
    e = np.array([10 * np.log10((lp[i:i + w] ** 2).mean() + 1e-12) for i in range(int(w0 * SR), int(w1 * SR), w)])
    dd = np.diff(e)
    for j in np.argsort(dd)[-3:][::-1]: print(f"low-band jump at {w0 + (j + 1) * .02:.3f} s ({dd[j]:.1f} dB)")
