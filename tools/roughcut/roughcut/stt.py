"""Whisper on the GPU without torch.

CTranslate2 ships its own CUDA runtime, so faster-whisper reaches the RTX 4050
with no torch anywhere — the only reason a GPU is usable on this machine.
Placement logic copied (not imported) from light/daemon/ears.py: importing
would couple this to another project's internals.
"""
import os

DEFAULT_MODEL = os.environ.get("ROUGHCUT_STT_MODEL", "large-v3")
GPU_COMPUTE = os.environ.get("ROUGHCUT_STT_COMPUTE", "float16")
_cache = {}
FALLBACK = ("small", "cpu", "int8")
_warned = False


def placement() -> tuple:
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count():
            return ("cuda", GPU_COMPUTE)
    except Exception:
        pass
    return ("cpu", "int8")


def _load(size: str, device: str, compute: str):
    from faster_whisper import WhisperModel
    return WhisperModel(size, device=device, compute_type=compute)


def _model(size: str, loader=_load, placer=placement):
    """Load and cache a model, degrading to CPU on a CUDA OOM.

    The degraded model is cached under its OWN key and the requested key is
    aliased to it. Caching it under the requested CUDA key instead would mean
    every later call silently receives small-on-CPU while believing it holds
    the GPU model. `loader` and `placer` are injectable so the OOM path is
    testable on a machine that has no GPU at all.
    """
    global _warned
    device, compute = placer()
    key = (size, device, compute)
    if key in _cache:
        return _cache[key]
    try:
        _cache[key] = loader(size, device, compute)
    except Exception as e:
        if device != "cuda":
            raise
        # 6GB card shared with whatever else is running. An OOM must degrade the
        # run, not kill it. ROUGHCUT_STT_COMPUTE=int8_float16 halves VRAM.
        if not _warned:
            print(f"[stt] {size} on GPU failed ({e}); using {FALLBACK[0]} on CPU for this run")
            _warned = True
        if FALLBACK not in _cache:
            _cache[FALLBACK] = loader(*FALLBACK)
        _cache[key] = _cache[FALLBACK]      # alias, so the OOM is not retried
    return _cache[key]


def transcribe(path, model_size: str = "", language: str = "") -> list:
    """-> [{'word','start','end'}], word-level, in order."""
    # vad_filter is not optional here. On non-speech audio (music, tone, room
    # noise) Whisper confidently hallucinates — a 440Hz test tone transcribes as
    # "Thanks for watching!" with real-looking timestamps. That lands in
    # clips.json as the description of the clip and misleads shot selection,
    # which is worse than an empty transcript. Silero VAD ships with
    # faster-whisper, so this costs nothing.
    segments, _ = _model(model_size or DEFAULT_MODEL).transcribe(
        str(path), beam_size=5, word_timestamps=True,
        language=language or None, vad_filter=True,
    )
    words = []
    for seg in segments:
        for w in (seg.words or []):
            words.append({"word": w.word.strip(),
                          "start": float(w.start), "end": float(w.end)})
    return words


def _selfcheck() -> None:
    calls = []

    class Fake:
        def __init__(self, tag):
            self.tag = tag

    def fake_loader(size, device, compute):
        calls.append((size, device, compute))
        if device == "cuda":
            raise RuntimeError("simulated CUDA OOM")
        return Fake((size, device, compute))

    fixed_placer = lambda: ("cuda", "float16")

    global _cache, _warned
    _cache, _warned = {}, False
    m1 = _model("large-v3", loader=fake_loader, placer=fixed_placer)
    # The degraded model is reachable under its own honest key ...
    assert FALLBACK in _cache, list(_cache)
    assert _cache[FALLBACK] is m1
    # ... and the requested cuda key is an alias to the same object, not a
    # separate entry claiming to be the GPU model. Fixed key so this passes
    # on a CPU-only machine too, where the real placement() never says cuda.
    assert _cache[("large-v3", "cuda", "float16")] is m1

    before = len(calls)
    m2 = _model("large-v3", loader=fake_loader, placer=fixed_placer)
    assert m2 is m1
    assert len(calls) == before, "cached alias must not re-attempt the OOM"

    _cache, _warned = {}, False
    print("stt selfcheck OK")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        ws = transcribe(sys.argv[1])
        print(f"{len(ws)} words, {ws[-1]['end']:.1f}s")
        print(" ".join(w["word"] for w in ws[:40]))
    else:
        _selfcheck()
