"""Audio QA with numbers in place of "sounds good". Run with C:\\VOLUME_D\\Ideas\\davinci-resolve-mcp\\venv\\Scripts\\python.exe.

  voice <voice.wav> [--words N] [--voice female|male]   pitch, expressiveness, pace, harshness, mud
  mix   <final.wav|mp4> [--voice-stem v.wav]              loudness, true peak, voice-over-music gap
  music <track.mp3>                                       tempo, brightness, dynamics (is it a usable bed?)

Targets (the house standard; each line prints PASS/FAIL with the measured value):
  voice pitch median   female 165-215 Hz, male 95-135 Hz   ("not too high, not too low")
  pitch movement       IQR >= 2.0 semitones                ("not monotone")
  pace                 170-195 wpm over the whole voice track, pauses included ("slightly fast"; Maan v2 = 181)
  clarity              1-4 kHz vs 150-500 Hz: -10 to -3 dB  (below = muddy/boomy, above = thin)
  air                  4-8 kHz vs 1-4 kHz: -8 to -2 dB      (below = dull, above = hissy)
  harshness            5-9 kHz share of energy <= 7%        (sibilance)
  Calibrated on justyn.ai's own lav audio (12 reels): clarity median -6.5 dB, air -3.8 dB, harshness 2.3%, pitch ~120 Hz (male).
  Kokoro voices measured 2026-11-18: af_heart 199 Hz / 4.3 st / clarity -8.6 / air -6.0 -> PASS (default female);
  bf_emma 182 Hz / 2.5 st / -4.8 / -5.0 -> PASS (British alternative); af_bella clarity -12.1 FAIL (muddy); af_nicole 154 Hz FAIL (low).
  mix loudness         -14 +/- 1 LUFS integrated, true peak <= -1.0 dBTP (Instagram / YouTube norm)
  voice over music     music sits >= 14 dB under the voice while speaking (speech is never fighting the bed)
  music bed            90-128 BPM, spectral centroid 1.0-3.5 kHz, crest factor 8-20 dB
"""
import json, re, subprocess, sys
import numpy as np

SR = 22050


def load(path, sr=SR):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                        capture_output=True, check=True).stdout, np.float32).copy()


def f0_track(x, sr=SR, fmin=70, fmax=400, hop=256, win=1024):
    """YIN-style pitch per frame; returns voiced F0 values in Hz."""
    out = []
    lo, hi = int(sr / fmax), int(sr / fmin)
    for i in range(0, len(x) - win - hi, hop):
        f = x[i:i + win + hi]
        if np.sqrt(np.mean(f[:win] ** 2)) < 0.02: continue
        d = np.array([np.sum((f[:win] - f[t:t + win]) ** 2) for t in range(lo, hi)])
        cm = d / (np.cumsum(d) / np.arange(1, len(d) + 1) + 1e-9)
        k = np.argmin(cm)
        if cm[k] < 0.25: out.append(sr / (k + lo))
    return np.array(out)


def band_share(x, sr, a, b):
    s = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(s[(f >= a) & (f < b)].sum() / max(s[f >= 50].sum(), 1e-12))


def ratio(x, a, b, c, d, sr=SR):
    s = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(10 * np.log10(s[(f >= a) & (f < b)].sum() / max(s[(f >= c) & (f < d)].sum(), 1e-12)))


def ebur(path):
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
    return i, tp


def row(name, val, ok, unit=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name:<22} {val}{unit}"); return ok


def voice(path, words=None, kind="female"):
    x = load(path); dur = len(x) / SR
    f0 = f0_track(x[: SR * 60])  # first minute is enough for pitch stats
    med = float(np.median(f0)) if len(f0) else 0
    iqr = float(12 * np.log2(np.percentile(f0, 75) / np.percentile(f0, 25))) if len(f0) > 10 else 0
    lo, hi = (165, 215) if kind == "female" else (95, 135)
    seg = x[: SR * 30]
    clar, air = ratio(seg, 1000, 4000, 150, 500), ratio(seg, 4000, 8000, 1000, 4000)
    ok = [row("pitch median", f"{med:.0f}", lo <= med <= hi, f" Hz (target {lo}-{hi})"),
          row("pitch movement", f"{iqr:.1f}", iqr >= 2.0, " semitones IQR (>= 2.0)"),
          row("clarity 1-4k/150-500", f"{clar:.1f}", -10 <= clar <= -3, " dB (-10 to -3)"),
          row("air 4-8k/1-4k", f"{air:.1f}", -8 <= air <= -2, " dB (-8 to -2)"),
          row("harshness 5-9k", f"{100 * band_share(seg, SR, 5000, 9000):.1f}", band_share(seg, SR, 5000, 9000) <= .07, " % (<= 7)")]
    if words: ok.append(row("pace (whole track)", f"{words / (dur / 60):.0f}", 170 <= words / (dur / 60) <= 195, " wpm (170-195)"))
    return all(ok)


def mix(path, stem=None):
    i, tp = ebur(path)
    ok = [row("loudness", f"{i:.1f}", abs(i + 14) <= 1, " LUFS (-14 +/- 1)"), row("true peak", f"{tp:.1f}", tp <= -1.0, " dBTP (<= -1.0)")]
    if stem:
        g = voice_gap(load(path), load(stem))
        ok.append(row("voice over music", f"{g:.1f}", g >= 14, " dB median while speaking (>= 14)"))
    return all(ok)


def voice_gap(m, v, sr=SR):
    """Median dB of voice over everything else while speaking. The mix is usually loudness-normalised, so the voice
    inside it is NOT at the stem's level: fit the voice's gain in the mix (least squares) and subtract the scaled stem."""
    n = min(len(m), len(v)); m, v = m[:n], v[:n]
    hop = sr // 10
    rms = np.array([np.sqrt(np.mean(v[k:k + hop] ** 2)) for k in range(0, n - hop, hop)])
    speak = rms > max(0.1 * rms.max(), 1e-4)
    idx = np.concatenate([np.arange(k * hop, (k + 1) * hop) for k in np.flatnonzero(speak)]) if speak.any() else np.arange(n)
    gain = float(np.dot(m[idx], v[idx]) / max(np.dot(v[idx], v[idx]), 1e-12))
    rest = m - gain * v
    gaps = [20 * np.log10(np.sqrt(np.mean((gain * v[k * hop:(k + 1) * hop]) ** 2)) / max(np.sqrt(np.mean(rest[k * hop:(k + 1) * hop] ** 2)), 1e-7))
            for k in np.flatnonzero(speak)]
    return float(np.median(gaps)) if gaps else 0.0


def music(path):
    x = load(path); x60 = x[: SR * 60]
    hop = 512; env = np.array([np.sqrt(np.mean(x60[i:i + hop] ** 2)) for i in range(0, len(x60) - hop, hop)])
    on = np.maximum(0, np.diff(env)); ac = np.correlate(on - on.mean(), on - on.mean(), "full")[len(on) - 1:]
    fps = SR / hop; lags = np.arange(len(ac)) / fps; band = (lags > 60 / 128) & (lags < 60 / 90)
    bpm = 60 / lags[band][np.argmax(ac[band])] if band.any() else 0
    s = np.abs(np.fft.rfft(x60 * np.hanning(len(x60)))); f = np.fft.rfftfreq(len(x60), 1 / SR)
    cen = float((s * f).sum() / s.sum())
    crest = float(20 * np.log10(np.abs(x60).max() / (np.sqrt(np.mean(x60 ** 2)) + 1e-9)))
    return all([row("tempo", f"{bpm:.0f}", 90 <= bpm <= 128, " BPM (90-128)"),
                row("brightness", f"{cen / 1000:.2f}", 1.0 <= cen / 1000 <= 3.5, " kHz centroid (1.0-3.5)"),
                row("crest factor", f"{crest:.1f}", 8 <= crest <= 20, " dB (8-20)")])


if __name__ == "__main__":
    t = np.arange(SR * 2) / SR
    tone = (0.3 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
    f0 = f0_track(tone)
    assert len(f0) and abs(np.median(f0) - 200) < 3, np.median(f0)
    # voice_gap must ignore the mix's overall gain: voice + bed 20 dB down, then the whole mix scaled by 0.4
    vo = (0.3 * np.sin(2 * np.pi * 220 * t) * (t % 1 < .6)).astype(np.float32)
    bed = (0.03 * np.sin(2 * np.pi * 97 * t)).astype(np.float32)
    gg = voice_gap(0.4 * (vo + bed), vo)
    assert abs(gg - 20) < 1.0, gg
    a = sys.argv[1:]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if not a: print(__doc__); sys.exit()
    ok = {"voice": lambda: voice(a[1], int(opt("--words")) if opt("--words") else None, opt("--voice", "female")),
          "mix": lambda: mix(a[1], opt("--voice-stem")), "music": lambda: music(a[1])}[a[0]]()
    print("RESULT:", "PASS" if ok else "FAIL"); sys.exit(0 if ok else 1)
