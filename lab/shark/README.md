# Shark avatar rig: footage for effect tests

A 3D shark in a black puffer jacket (no brand logo), walking on two feet and talking, built in three.js and driven
only by `window.seek(t)`. It replaces talking-head footage, so every effect can be tested without a camera.
Because we render it ourselves, the **cutout is free**: the `shark` layer is RGBA with a transparent background.

Files: `shark.html` (rig), `render_plate.py` (frames), `envelope.py` (voice → mouth), `demo.json` (walk-in),
`talk.json` + `talk.wav` (talking test), `out/talk.mp4` (composited check). GPU rendering works (ANGLE D3D11), at roughly 0.2 s per frame.

## Make footage for a new video

```bash
cd "C:/VOLUME_D/Ideas/Content Creation/lab/shark"
# 1. voice (Kokoro, local). Shark voice used so far: am_onyx at speed 1.1. Other voices: am_michael, bm_george, am_puck.
/c/VOLUME_D/Ideas/light/.venv/Scripts/python.exe -X utf8 -c "from kokoro_onnx import Kokoro; import soundfile as sf; M='C:/VOLUME_D/Ideas/light/models/'; k=Kokoro(M+'kokoro-v1.0.onnx',M+'voices-v1.0.bin'); a,r=k.create('YOUR LINE', voice='am_onyx', speed=1.1, lang='en-us'); sf.write('my.wav',a,r)"
# 2. write my.json (see the config below), then fill its mouth curve + duration from the voice
/c/VOLUME_D/Ideas/davinci-resolve-mcp/venv/Scripts/python.exe envelope.py my.wav my.json
# 3. check stills, then render both layers (run them in parallel)
/c/Python314/python.exe render_plate.py probe my.json both 1 3 5        # -> out/probe_both.png
/c/Python314/python.exe render_plate.py frames my.json shark <outdir>/shark   # RGBA PNGs, %05d.png
/c/Python314/python.exe render_plate.py frames my.json room  <outdir>/room    # background only
```
Config paths are relative to this folder. Put per-video configs and plates under your own folder; any path under `lab/shark/` that the server can reach works.
Word timings for captions: transcribe the voice per line with roughcut (`roughcut.stt.transcribe(path, language="en")`, run with
`PYTHONPATH=C:/VOLUME_D/Ideas/roughcut` and `C:/VOLUME_D/Ideas/davinci-resolve-mcp/venv/Scripts/python.exe`). Do it per line, not on
the whole file: whole-file timings drift about 0.3 s late (measured).

## Config

```json
{"fps": 30, "size": [1080, 1920], "duration": 7.1, "stepsPerSec": 1.7,
 "mouth": [/* filled by envelope.py */],
 "room": {"wall": 3029811, "floor": 5915186, "trim": 3425594},
 "keys": {
   "cam":     [[0, "medium"], [3.0, "close"]],
   "yaw":     [[0, 25]],
   "x":       [[0, -1.6], [3.8, 0]],
   "z":       [[0, 0]],
   "walk":    [[0, 1], [3.6, 0]],
   "gesture": [[0, 0.8]],
   "camShift":[[0, 0]]
 }}
```
- `cam` presets: `wide` (full body), `medium` (thighs up, the default talking shot), `close` (head and shoulders), `low`, `top`. A change springs over about 0.5 s (170/26). Put two keys a frame apart to make a hard cut.
- `yaw` in degrees (0 faces the camera; about 20–30 reads best as a shark, 90 is profile); springs at 120/22.
- `x`/`z` move linearly (constant walking speed); `walk` 0..1 blends the walk cycle in and out (320/30).
- `gesture` 0..1 sets how much the fins move while talking. `camShift` reframes sideways (for example, to leave room for type).
- `room` colours are integers (0xRRGGBB); the default is justyn's dark-green panelled study. Layers: `shark`, `room`, `both`.

## Gotchas
- ES modules don't load from `file://`, so `render_plate.py` serves the folder on a random localhost port.
- The shark layer keeps the room's lamp lights, so it matches the room plate when composited.
- Deterministic: no `Math.random`; idle motion is a sum of sines. The same `t` always gives the same frame.
