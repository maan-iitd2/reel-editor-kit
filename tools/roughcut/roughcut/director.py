"""The agentic half: an intent sentence in, a shot plan out.

Put a key in `.env` and this works. Nothing else to configure — the provider is
chosen from whichever key you supplied.

    ANTHROPIC_API_KEY=...     best quality, ~$0.10/video, does not train on you
    GEMINI_API_KEY=...        free tier, 20 requests/day
    OPENROUTER_API_KEY=...    free ':free' models
    MISTRAL_API_KEY=...       free Experiment tier, ~1B tokens/month
    NVIDIA_API_KEY=...        NVIDIA NIM, ~40 RPM

**This is the only file that costs money**, and only on the `claude` provider.
Everything else in roughcut runs on your own hardware.

Anthropic goes through its official SDK; the other three are plain HTTP, which
avoids three more dependencies for what is one POST each. Schema-enforced JSON
is used where the provider supports it and `parse_json` picks up the slack
where it does not — that is what makes the long tail of free vision models
usable at all, since most of them never document structured output.
"""
import base64
import json
import os
import re
import time
from pathlib import Path

from .shotplan import Shot, ShotPlan, render_plan

MAX_FRAMES = 3          # per clip; frames dominate every provider's bill
MAX_TAKES = 20
# Hard ceiling on images in one request. Every free vision model caps this and
# they disagree wildly — NIM's llama-3.2-90b allows 1, OpenRouter's nemotron 10 —
# so `frames per clip x clips` reliably 400s once you have a few takes. Budget
# the total instead and let clips share it.
MAX_IMAGES = int(os.environ.get("ROUGHCUT_MAX_IMAGES", "8"))
TIMEOUT = 180.0
RETRIES = 3             # attempts per call, not extra tries after the first
# _http retries inside a single attempt, so the two layers multiply. Keep this
# low: a 504 can take the full TIMEOUT to arrive, and 3x3 attempts of that is a
# quarter of an hour of apparent hang.
HTTP_RETRIES = 2
BACKOFF = 5.0           # seconds x attempt; free-tier stalls outlast 1s waits

# provider -> (env var, default model). Order is the auto-pick priority:
# quality first, then free tiers by how well their limits suit one call/video.
PROVIDERS = {
    "claude":     ("ANTHROPIC_API_KEY",  "claude-opus-4-8"),
    "gemini":     ("GEMINI_API_KEY",     "gemini-3.5-flash"),
    "openrouter": ("OPENROUTER_API_KEY", "nvidia/nemotron-nano-12b-v2-vl:free"),
    "mistral":    ("MISTRAL_API_KEY",    "mistral-small-latest"),
    "nim":        ("NVIDIA_API_KEY",     "meta/llama-3.2-90b-vision-instruct"),
}
# Only these enforce a JSON schema server-side. The rest are asked politely and
# parsed defensively.
SCHEMA_CAPABLE = {"claude", "gemini"}

SYSTEM = """You are the editor on a small video team. You are given every take \
from one shoot: each take's transcript and a few frames sampled from it. You \
choose which takes make the final cut.

How to choose:
- The footage is faceless and horizontal: hands, screen, objects. What is \
visible matters as much as what is said. Judge focus, framing, and whether the \
subject is actually in shot.
- Prefer the last of several attempts at the same line. A fumbled take followed \
by a clean one means keep the clean one.
- Trim to where speech actually starts and ends. Do not include long silences.
- Order for sense, not for chronology. The strongest line often belongs first.
- Vary zoom slightly between adjacent shots (1.0 to 1.10) so cuts read as \
intentional rather than accidental.

Be decisive and be honest about what you rejected and why. The person reading \
your plan approves it in about fifteen seconds, so the reasoning must be \
skimmable and specific: "07 is the only take where the hand stays in frame", \
not "good quality"."""

JSON_RULE = """
Reply with ONE JSON object and nothing else. No prose, no markdown fence.
{"shots":[{"clip":"<exact filename>","start":<seconds>,"end":<seconds>,
"zoom":<1.0-1.10>,"note":"<why this shot>"}],
"why":"<why these takes>","rejected":"<what you dropped and why>"}

start, end and zoom are plain JSON numbers: 4.9, not "4.9s" and not "4.9"."""

SCHEMA = {
    "type": "object",
    "properties": {
        "shots": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "clip": {"type": "string"}, "start": {"type": "number"},
                "end": {"type": "number"}, "zoom": {"type": "number"},
                "note": {"type": "string"},
            },
            "required": ["clip", "start", "end", "zoom", "note"],
            "additionalProperties": False}},
        "why": {"type": "string"},
        "rejected": {"type": "string"},
    },
    "required": ["shots", "why", "rejected"],
    "additionalProperties": False,
}


# ── config ───────────────────────────────────────────────────────────────────

def load_env(path=".env") -> dict:
    """Read KEY=VALUE lines into os.environ without overwriting real env vars.

    A real environment variable beats the file, so a shell export can override
    .env for one run. Hand-written keys often arrive quoted or with a UTF-8 BOM;
    both are stripped here rather than failing far away with 'invalid key'.
    """
    p = Path(path)
    found = {}
    if not p.exists():
        return found
    for raw in p.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v:
            found[k] = v
            os.environ.setdefault(k, v)
    return found


def pick_provider() -> tuple:
    """-> (provider, model). Explicit choice wins, else the first key present."""
    load_env()
    want = os.environ.get("ROUGHCUT_DIRECTOR_PROVIDER", "").strip().lower()
    model_override = os.environ.get("ROUGHCUT_DIRECTOR_MODEL", "").strip()
    if want:
        if want not in PROVIDERS:
            raise SystemExit(f"Unknown provider {want!r}. "
                             f"Choose one of: {', '.join(PROVIDERS)}")
        env_var, default = PROVIDERS[want]
        if not os.environ.get(env_var):
            raise SystemExit(f"ROUGHCUT_DIRECTOR_PROVIDER={want} but {env_var} "
                             f"is not set. Add it to .env")
        return want, (model_override or default)
    for name, (env_var, default) in PROVIDERS.items():
        if os.environ.get(env_var):
            return name, (model_override or default)
    raise SystemExit(
        "No API key found. Put one line in " + str(Path(".env").resolve()) + ":\n"
        + "\n".join(f"  {v[0]}=...   ({k})" for k, v in PROVIDERS.items())
        + "\nThe director is the only part of roughcut that needs a key; "
          "everything else runs locally.")


# ── prompt ───────────────────────────────────────────────────────────────────

def _share(budget: int, n: int, cap: int) -> list:
    """Split `budget` images across `n` takes, no take above `cap`.

    Earlier takes get the remainder. When there are more takes than images some
    take gets zero — that take still sends its transcript, so it stays in the
    running, it is just judged on words alone.
    """
    if n <= 0:
        return []
    per = [min(cap, budget // n)] * n
    for i in range(min(budget % n, n)):
        if per[i] < cap:
            per[i] += 1
    return per


def _spread(frames: list, n: int) -> list:
    """Pick n frames spread across the take. n=1 takes the middle, not the first
    — an opening frame is often the camera still settling."""
    if n <= 0 or not frames:
        return []
    if n >= len(frames):
        return list(frames)
    step = len(frames) / n
    return [frames[min(len(frames) - 1, int(i * step + step / 2))] for i in range(n)]


def build_parts(clips: list, intent: str, target_s: float,
                max_frames: int = MAX_FRAMES, max_images: int = 0) -> list:
    """Provider-neutral parts: {"text":...} and {"image": <bytes>}."""
    takes = clips[:MAX_TAKES]
    per = _share(max_images or MAX_IMAGES, len(takes), max_frames)
    parts = [{"text": f"Intent: {intent}\nTarget length: about {target_s:g} "
                      f"seconds\n\nHere are {len(takes)} takes."}]
    for i, c in enumerate(takes):
        parts.append({"text": f"\n--- {c['file']} · {c['duration']:.1f}s"
                              + (f" · cuts at {c['cuts']}" if c.get("cuts") else "")
                              + f"\ntranscript: {c.get('text') or '(no speech)'}"})
        for fp in _spread([f for f in (c.get("frames") or []) if Path(f).exists()],
                          per[i]):
            parts.append({"image": Path(fp).read_bytes()})
    parts.append({"text": "Choose the takes and return the shot plan."})
    return parts


def _b64(b) -> str:
    return base64.standard_b64encode(b).decode()


# ── response parsing ─────────────────────────────────────────────────────────

def parse_json(text: str) -> dict:
    """Recover the JSON object from a reply that may not be pure JSON.

    Schema-enforced providers return clean JSON. The free vision models mostly
    do not document structured output, and in practice wrap it in a markdown
    fence or add a sentence of preamble. Being lenient here is what lets any
    vision model drive this, so it is deliberate, not sloppiness.
    """
    if not text or not text.strip():
        raise SystemExit("The model returned an empty response.")
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*(.+?)```", t, re.S)
    if fence:
        t = fence.group(1).strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass
    start, depth = t.find("{"), 0
    if start >= 0:                       # scan for the first balanced object
        for i in range(start, len(t)):
            depth += (t[i] == "{") - (t[i] == "}")
            if depth == 0:
                try:
                    return json.loads(t[start:i + 1])
                except json.JSONDecodeError:
                    break
    raise SystemExit("Could not read a shot plan out of the reply:\n" + text[:400])


_NUM = re.compile(r"-?\d+(?:\.\d+)?")


def _num(value, default=None):
    """First number in a value that should have been a number.

    Free models return 4.9, "4.9" and "4.9s" for the same field, and plain
    float() turns the last of those into a dropped shot — silently, so the
    result is an empty plan with no clue why. Being lenient here is the same
    bargain as parse_json.

    ponytail: "0:05" reads as 0, not 5. Parse mm:ss if a model ever emits it.
    """
    if isinstance(value, bool):
        return default
    if isinstance(value, (int, float)):
        return float(value)
    m = _NUM.search(str(value or ""))
    return float(m.group()) if m else default


def to_plan(data: dict, intent: str, target_s: float, music: str = "",
            known=None) -> ShotPlan:
    """Model JSON -> ShotPlan. Clamps zoom; validate() catches the rest.

    `known` is the set of filenames actually offered. Models invent plausible
    neighbours — asked to choose among "... (1)" to "... (3)" one returned
    "... (6)" and "... (7)" — and a plan naming a file that does not exist is
    only discovered at build time, after the human has approved it.
    """
    shots = []
    for s in data.get("shots") or []:
        clip = str(s.get("clip", "")).strip()
        if known is not None and clip not in known:
            continue                      # invented filename
        start, end = _num(s.get("start")), _num(s.get("end"))
        if start is None or end is None:
            continue                      # a malformed shot must not kill the plan
        shots.append(Shot(clip=clip, start=start, end=end,
                          zoom=min(2.0, max(1.0, _num(s.get("zoom"), 1.0) or 1.0)),
                          enter="cut", note=str(s.get("note") or "").strip()))
    return ShotPlan(intent=intent, target_s=target_s, music=music, shots=shots,
                    why=str(data.get("why") or "").strip(),
                    rejected=str(data.get("rejected") or "").strip())


# ── providers ────────────────────────────────────────────────────────────────

def _call_claude(model: str, parts: list) -> str:
    import anthropic
    content = [{"type": "image", "source": {"type": "base64",
                "media_type": "image/jpeg", "data": _b64(p["image"])}}
               if "image" in p else {"type": "text", "text": p["text"]}
               for p in parts]
    client = anthropic.Anthropic(timeout=TIMEOUT)
    try:
        resp = client.messages.create(
            model=model, max_tokens=16000, system=SYSTEM,
            # Choosing between takes is a judgement call — exactly what adaptive
            # thinking is for.
            thinking={"type": "adaptive"},
            output_config={"effort": "high",
                           "format": {"type": "json_schema", "schema": SCHEMA}},
            messages=[{"role": "user", "content": content}])
    except anthropic.AuthenticationError:
        raise SystemExit("ANTHROPIC_API_KEY was rejected. Check the key in .env")
    except anthropic.RateLimitError:
        raise SystemExit("Anthropic rate limit. Wait a moment and retry.")
    except anthropic.APIConnectionError:
        raise SystemExit("Could not reach the Anthropic API.")
    if resp.stop_reason == "refusal":
        raise SystemExit("The model declined this request.")
    return next((b.text for b in resp.content if b.type == "text"), "")


def _http(url: str, headers: dict, payload: dict, poster=None, sleep=None) -> dict:
    """POST with retries on the failures free tiers hand out constantly.

    Observed on one afternoon across three providers: Gemini 503 "high demand",
    OpenRouter 504 "upstream idle timeout", OpenRouter 429 from the Google AI
    Studio backend. All transient, all previously fatal — the run died and took
    several minutes of transcription with it. A 400 is NOT retried: a bad
    request is bad every time.

    `poster` and `sleep` are injectable so the retry path is testable offline.
    """
    import httpx
    post = poster or (lambda: httpx.post(url, headers=headers, json=payload,
                                         timeout=TIMEOUT))
    nap = sleep or time.sleep
    host = url.split("/")[2]
    last = ""
    for attempt in range(HTTP_RETRIES):
        wait = 0.0
        try:
            r = post()
        except httpx.HTTPError as e:
            last = f"Could not reach {host}: {e}"
        else:
            if r.status_code in (401, 403):
                raise SystemExit(f"{host} rejected the API key. Check .env")
            if r.status_code < 400:
                return r.json()
            if r.status_code != 429 and r.status_code < 500:
                raise SystemExit(f"{host} returned {r.status_code}: {r.text[:300]}")
            last = (f"{host} rate limit hit. Free tiers are small — wait, or "
                    "switch provider." if r.status_code == 429
                    else f"{host} returned {r.status_code}: {r.text[:300]}")
            try:            # honour Retry-After when the server sends one
                wait = float(r.headers.get("Retry-After") or 0)
            except ValueError:
                wait = 0.0
        if attempt < HTTP_RETRIES - 1:
            nap(max(wait, BACKOFF * (attempt + 1)))
    raise SystemExit(f"{last}  (gave up after {HTTP_RETRIES} attempts)")


def _call_gemini(model: str, parts: list) -> str:
    body = [{"inline_data": {"mime_type": "image/jpeg", "data": _b64(p["image"])}}
            if "image" in p else {"text": p["text"]} for p in parts]
    data = _http(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        {"x-goog-api-key": os.environ["GEMINI_API_KEY"],
         "Content-Type": "application/json"},
        {"systemInstruction": {"parts": [{"text": SYSTEM}]},
         "contents": [{"role": "user", "parts": body}],
         "generationConfig": {"responseMimeType": "application/json",
                              "responseSchema": _gemini_schema()}})
    cands = data.get("candidates") or []
    if not cands:
        raise SystemExit(f"Gemini returned no candidates: {json.dumps(data)[:300]}")
    return "".join(p.get("text", "")
                   for p in cands[0].get("content", {}).get("parts", []))


def _gemini_schema() -> dict:
    """Gemini's schema dialect has no additionalProperties; sending it 400s."""
    def strip(node):
        if isinstance(node, dict):
            return {k: strip(v) for k, v in node.items() if k != "additionalProperties"}
        if isinstance(node, list):
            return [strip(v) for v in node]
        return node
    return strip(SCHEMA)


def _call_openai_compat(model: str, parts: list, url: str, key: str) -> str:
    """OpenRouter and NVIDIA NIM both speak the OpenAI chat-completions shape."""
    content = [{"type": "image_url",
                "image_url": {"url": "data:image/jpeg;base64," + _b64(p["image"])}}
               if "image" in p else {"type": "text", "text": p["text"]}
               for p in parts]
    data = _http(url, {"Authorization": f"Bearer {key}",
                       "Content-Type": "application/json"},
                 {"model": model, "max_tokens": 8000,
                  "messages": [{"role": "system", "content": SYSTEM + JSON_RULE},
                               {"role": "user", "content": content}]})
    choices = data.get("choices") or []
    if not choices:
        raise SystemExit(f"No choices in reply: {json.dumps(data)[:300]}")
    return choices[0].get("message", {}).get("content") or ""


def call(provider: str, model: str, parts: list) -> str:
    if provider == "claude":
        return _call_claude(model, parts)
    if provider == "gemini":
        return _call_gemini(model, parts)
    if provider == "openrouter":
        return _call_openai_compat(model, parts,
                                   "https://openrouter.ai/api/v1/chat/completions",
                                   os.environ["OPENROUTER_API_KEY"])
    if provider == "mistral":
        return _call_openai_compat(model, parts,
                                   "https://api.mistral.ai/v1/chat/completions",
                                   os.environ["MISTRAL_API_KEY"])
    if provider == "nim":
        return _call_openai_compat(model, parts,
                                   "https://integrate.api.nvidia.com/v1/chat/completions",
                                   os.environ["NVIDIA_API_KEY"])
    raise SystemExit(f"Unknown provider {provider!r}")


# ── entry point ──────────────────────────────────────────────────────────────

def direct(clips: list, intent: str, target_s: float = 30.0, music: str = "",
           caller=None) -> ShotPlan:
    """Ask whichever provider you have a key for to cut the video.

    The reply is retried, not just the HTTP call. Free models are erratic in a
    way a status code never shows: the same prompt returns clean JSON, then a
    truncated object, then a plan whose every shot is unusable. All three come
    back 200 OK. Asking again is cheap and usually enough.
    """
    provider, model = pick_provider()
    parts = build_parts(clips, intent, target_s)
    last = "the model never returned a usable plan"
    for _ in range(RETRIES):
        try:
            # The call is inside the retry on purpose: OpenRouter reports an
            # upstream 504 as HTTP 200 with an error body, so _http's status
            # check never sees it and only a fresh call can recover.
            plan = to_plan(parse_json((caller or call)(provider, model, parts)),
                           intent, target_s, music,
                           known={c.get("file") for c in clips[:MAX_TAKES]})
        except SystemExit as e:
            last = str(e)
            if "rejected the API key" in last:
                raise           # a bad key is bad three times too
            continue
        if plan.shots:
            return plan
        # Parsed, but every shot was dropped — usually the model named clips
        # that do not exist, or gave times we could not read. Retrying beats
        # handing back an empty plan that looks like a considered choice.
        last = "the model returned a plan with no usable shots"
    raise SystemExit(f"Gave up after {RETRIES} attempts: {last}")


def describe() -> str:
    try:
        provider, model = pick_provider()
    except SystemExit:
        return "no key set"
    paid = " (paid, ~$0.10/video)" if provider == "claude" else " (free tier)"
    schema = "" if provider in SCHEMA_CAPABLE else ", lenient JSON"
    return f"{provider}: {model}{paid}{schema}"


def _selfcheck() -> None:
    import tempfile

    clips = [{"file": "a.mp4", "duration": 8.0, "text": "so today, no wait",
              "frames": [], "cuts": [2.0]},
             {"file": "b.mp4", "duration": 9.0, "text": "so today I show you this",
              "frames": []}]

    # -- .env loading --
    with tempfile.TemporaryDirectory() as d:
        env = Path(d) / ".env"
        env.write_text('# comment\nFOO_KEY="quoted"\nBAR_KEY = spaced \n\nBAD\n',
                       encoding="utf-8-sig")           # BOM on purpose
        got = load_env(env)
        assert got == {"FOO_KEY": "quoted", "BAR_KEY": "spaced"}, got
        assert load_env(Path(d) / "nope.env") == {}

    # -- provider auto-pick --
    saved = {v[0]: os.environ.pop(v[0], None) for v in PROVIDERS.values()}
    saved["ROUGHCUT_DIRECTOR_PROVIDER"] = os.environ.pop("ROUGHCUT_DIRECTOR_PROVIDER", None)
    saved["ROUGHCUT_DIRECTOR_MODEL"] = os.environ.pop("ROUGHCUT_DIRECTOR_MODEL", None)
    # pick_provider() loads .env from the CWD, so a real key file — the exact
    # thing this feature tells you to create — would leak into the assertions
    # below and fail "no key must be an error". Run them somewhere empty.
    cwd = os.getcwd()
    sandbox = tempfile.mkdtemp()
    os.chdir(sandbox)
    try:
        try:
            pick_provider()
            assert False, "no key must be an error"
        except SystemExit as e:
            assert "No API key found" in str(e)

        os.environ["NVIDIA_API_KEY"] = "x"
        assert pick_provider() == ("nim", PROVIDERS["nim"][1])
        # Priority: a Claude key outranks NIM even though NIM was set first.
        os.environ["ANTHROPIC_API_KEY"] = "x"
        assert pick_provider()[0] == "claude"
        # Explicit choice beats priority.
        os.environ["ROUGHCUT_DIRECTOR_PROVIDER"] = "nim"
        assert pick_provider()[0] == "nim"
        # ...but not if that provider has no key.
        os.environ["ROUGHCUT_DIRECTOR_PROVIDER"] = "gemini"
        try:
            pick_provider()
            assert False, "must refuse a provider whose key is missing"
        except SystemExit as e:
            assert "GEMINI_API_KEY" in str(e)
        os.environ["ROUGHCUT_DIRECTOR_PROVIDER"] = "nim"
        os.environ["ROUGHCUT_DIRECTOR_MODEL"] = "custom/model"
        assert pick_provider() == ("nim", "custom/model")

        # -- lenient JSON, the thing that unlocks the free models --
        want = {"shots": [], "why": "w", "rejected": "r"}
        assert parse_json(json.dumps(want)) == want
        assert parse_json("```json\n" + json.dumps(want) + "\n```") == want
        assert parse_json("Sure! Here you go:\n" + json.dumps(want)) == want
        assert parse_json("```\n" + json.dumps(want) + "\n```") == want
        # Nested braces must not end the scan early.
        deep = {"shots": [{"clip": "a", "start": 0, "end": 1, "zoom": 1, "note": "x"}],
                "why": "w", "rejected": "r"}
        assert parse_json("noise " + json.dumps(deep) + " trailing")["shots"][0]["clip"] == "a"
        for bad in ("", "   ", "no json at all", "{unclosed"):
            try:
                parse_json(bad)
                assert False, f"should have refused {bad!r}"
            except SystemExit:
                pass

        # -- to_plan tolerance --
        plan = to_plan({"shots": [
            {"clip": "b.mp4", "start": 1, "end": 5, "zoom": 9.9, "note": "clean"},
            {"clip": "x.mp4", "start": "oops", "end": 2},          # dropped, not fatal
        ], "why": "b is take two", "rejected": "a fumbled"}, "i", 30, music="m.mp3")
        assert len(plan.shots) == 1, [s.clip for s in plan.shots]
        assert plan.shots[0].zoom == 2.0 and plan.music == "m.mp3"

        # Free models type these fields however they like. Observed live from
        # nemotron: {"start": "0.0s", "zoom": "1.0"} — which float() rejects,
        # dropping every shot and yielding a silently empty plan.
        loose = to_plan({"shots": [
            {"clip": "a.mp4", "start": "0.0s", "end": "4.9s", "zoom": "1.05",
             "note": "n"},
            {"clip": "b.mp4", "start": 2, "end": "6 seconds", "zoom": None,
             "note": "n"},
        ], "why": "w", "rejected": "r"}, "i", 30)
        assert len(loose.shots) == 2, [(s.clip, s.start) for s in loose.shots]
        assert (loose.shots[0].start, loose.shots[0].end) == (0.0, 4.9)
        assert loose.shots[0].zoom == 1.05
        assert (loose.shots[1].start, loose.shots[1].end) == (2.0, 6.0)
        assert loose.shots[1].zoom == 1.0, loose.shots[1].zoom
        # Still drop a shot with no recoverable number, rather than invent one.
        assert to_plan({"shots": [{"clip": "c.mp4", "start": "oops", "end": "x"}]},
                       "i", 30).shots == []

        # Invented filenames must be dropped. Observed live: offered takes
        # numbered (1)-(3), nemotron returned (6) and (7).
        made_up = {"shots": [
            {"clip": "a.mp4", "start": 0, "end": 2, "zoom": 1.0, "note": "real"},
            {"clip": "a (7).mp4", "start": 2, "end": 4, "zoom": 1.0, "note": "fake"},
        ], "why": "w", "rejected": "r"}
        assert [s.clip for s in to_plan(made_up, "i", 30,
                                        known={"a.mp4", "b.mp4"}).shots] == ["a.mp4"]
        # Without `known` the caller gets everything, as before.
        assert len(to_plan(made_up, "i", 30).shots) == 2
        from .shotplan import parse_plan
        back = parse_plan(render_plan(plan))
        assert back.why == "b is take two" and back.rejected == "a fumbled"

        # -- parts are provider-neutral and frame-capped --
        with tempfile.TemporaryDirectory() as d:
            import subprocess
            fp = Path(d) / "f.jpg"
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                            "-i", "color=red:s=32x32", "-frames:v", "1", str(fp)],
                           check=True)
            parts = build_parts([{"file": "i.mp4", "duration": 2.0, "text": "hi",
                                  "frames": [str(fp)] * 5}], "x", 10, max_frames=2)
            assert sum("image" in p for p in parts) == 2

            # The total image budget is what every free model actually enforces.
            many = [{"file": f"{i}.mp4", "duration": 2.0, "text": "hi",
                     "frames": [str(fp)] * 3} for i in range(12)]
            for budget in (1, 8, 10, 100):
                n = sum("image" in p for p in build_parts(many, "x", 10,
                                                          max_images=budget))
                assert n <= budget, (budget, n)
                assert n <= 12 * MAX_FRAMES
            # Every take keeps its transcript even when it gets no frame at all.
            one = build_parts(many, "x", 10, max_images=1)
            assert sum("image" in p for p in one) == 1
            blob = " ".join(p["text"] for p in one if "text" in p)
            assert all(f"--- {i}.mp4" in blob for i in range(12)), blob[:200]
            blob = " ".join(p["text"] for p in parts if "text" in p)
            assert "i.mp4" in blob and "(no speech)" not in blob

        parts = build_parts(clips, "wiring it up", 30)
        blob = " ".join(p["text"] for p in parts if "text" in p)
        assert "wiring it up" in blob and "cuts at [2.0]" in blob

        # -- transient failures must be retried, permanent ones must not --
        class FakeResp:
            def __init__(self, code, body='{"ok":1}', headers=None):
                self.status_code, self.text = code, body
                self.headers = headers or {}

            def json(self):
                return json.loads(self.text)

        def sequence(*codes):
            """-> (poster, calls); poster yields each code in turn."""
            calls = []

            def poster():
                calls.append(1)
                c = codes[min(len(calls) - 1, len(codes) - 1)]
                return FakeResp(c) if not isinstance(c, FakeResp) else c
            return poster, calls

        naps = []
        noop = naps.append

        # A 503 then success: one retry, one nap, no exception.
        p, calls = sequence(503, 200)
        assert _http("https://h/x", {}, {}, poster=p, sleep=noop) == {"ok": 1}
        assert len(calls) == 2, calls
        assert naps == [BACKOFF], naps

        # 429 and 504 are retried too — both seen live from OpenRouter.
        for code in (429, 504, 500):
            p, calls = sequence(code, 200)
            assert _http("https://h/x", {}, {}, poster=p, sleep=noop) == {"ok": 1}
            assert len(calls) == 2, (code, calls)

        # Retry-After wins when it is longer than the backoff.
        naps.clear()
        after = [FakeResp(429, "{}", {"Retry-After": "30"}), FakeResp(200)]
        p = lambda: after.pop(0)
        assert _http("https://h/x", {}, {}, poster=p, sleep=noop) == {"ok": 1}
        assert naps == [30.0], naps

        # Exhausted retries surface the last error, not a generic one.
        p, calls = sequence(503)
        try:
            _http("https://h/x", {}, {}, poster=p, sleep=noop)
            assert False, "must give up eventually"
        except SystemExit as e:
            assert f"gave up after {HTTP_RETRIES}" in str(e), e
        assert len(calls) == HTTP_RETRIES, calls

        # A 400 is bad every time — retrying just wastes the free-tier quota.
        p, calls = sequence(400)
        try:
            _http("https://h/x", {}, {}, poster=p, sleep=noop)
            assert False, "400 must not be retried"
        except SystemExit as e:
            assert "gave up" not in str(e), e
        assert len(calls) == 1, calls

        # Nor is a rejected key.
        p, calls = sequence(401)
        try:
            _http("https://h/x", {}, {}, poster=p, sleep=noop)
            assert False, "401 must not be retried"
        except SystemExit as e:
            assert "rejected the API key" in str(e), e
        assert len(calls) == 1, calls

        # -- each provider serialises images its own way --
        img = [{"image": b"\xff\xd8\xff"}]
        seen = {}
        def fake_http(url, headers, payload):
            seen["url"], seen["payload"] = url, payload
            if "generativelanguage" in url:
                return {"candidates": [{"content": {"parts": [{"text": '{"shots":[],"why":"w","rejected":"r"}'}]}}]}
            return {"choices": [{"message": {"content": '{"shots":[],"why":"w","rejected":"r"}'}}]}

        # Patch this module's own globals. `import roughcut.director` would
        # load a SECOND module object when run as `python -m`, and patching
        # that copy leaves the running code calling the real network.
        import sys as _sys
        D = _sys.modules[__name__]
        real_http = D._http
        D._http = fake_http
        try:
            os.environ["GEMINI_API_KEY"] = "g"
            _call_gemini("gemini-3.5-flash", img)
            gpart = seen["payload"]["contents"][0]["parts"][0]
            assert "inline_data" in gpart, gpart
            # Gemini rejects additionalProperties; it must be stripped.
            assert "additionalProperties" not in json.dumps(
                seen["payload"]["generationConfig"]["responseSchema"])

            _call_openai_compat("m", img, "https://openrouter.ai/api/v1/chat/completions", "k")
            opart = seen["payload"]["messages"][1]["content"][0]
            assert opart["type"] == "image_url"
            assert opart["image_url"]["url"].startswith("data:image/jpeg;base64,")
            # Providers without schema support must be told the JSON rule.
            assert "ONE JSON object" in seen["payload"]["messages"][0]["content"]

            # call() must route each OpenAI-shaped provider to its own host —
            # they share one function, so a wrong URL is a silent copy-paste bug.
            os.environ["MISTRAL_API_KEY"] = "m"
            call("mistral", "mistral-small-latest", img)
            assert seen["url"] == "https://api.mistral.ai/v1/chat/completions", seen["url"]
            os.environ["NVIDIA_API_KEY"] = "n"
            call("nim", "meta/llama-3.2-90b-vision-instruct", img)
            assert seen["url"].startswith("https://integrate.api.nvidia.com/"), seen["url"]
        finally:
            D._http = real_http

        # -- direct() end to end against a fake caller, no network --
        def fake_caller(provider, model, parts):
            assert provider == "nim" and model == "custom/model"
            return "```json\n" + json.dumps(
                {"shots": [{"clip": "b.mp4", "start": 0.5, "end": 4.0,
                            "zoom": 1.0, "note": "clean"}],
                 "why": "picked b", "rejected": "a fumbled"}) + "\n```"
        got = direct(clips, "wiring it up", 30, music="m.mp3", caller=fake_caller)
        assert len(got.shots) == 1 and got.shots[0].clip == "b.mp4"
        assert got.rejected == "a fumbled"

        # An unusable reply must be retried, not surfaced. Seen live from
        # nemotron: a truncated object, then a clean one, same prompt.
        tries = []

        def flaky(provider, model, parts):
            tries.append(1)
            if len(tries) == 1:
                return '{"shots": [{"clip": "b.mp4", "start": 0,'   # cut off
            if len(tries) == 2:
                return '{"shots": [], "why": "w", "rejected": "r"}'  # no shots
            return json.dumps({"shots": [{"clip": "b.mp4", "start": 0.5, "end": 4.0,
                                          "zoom": 1.0, "note": "clean"}],
                               "why": "w", "rejected": "r"})
        ok = direct(clips, "i", 30, caller=flaky)
        assert len(ok.shots) == 1 and len(tries) == 3, (len(ok.shots), tries)

        # ...but a model that never produces shots must fail loudly, not return
        # an empty plan that reads like a deliberate choice.
        dead = lambda *a: '{"shots": [], "why": "w", "rejected": "r"}'
        try:
            direct(clips, "i", 30, caller=dead)
            assert False, "an always-empty plan must raise"
        except SystemExit as e:
            assert "no usable shots" in str(e), e
        assert "nim" in describe()
    finally:
        os.chdir(cwd)
        for k, v in saved.items():
            os.environ.pop(k, None)
            if v is not None:
                os.environ[k] = v
    print("director selfcheck OK")


if __name__ == "__main__":
    import sys
    if "--selfcheck" in sys.argv or len(sys.argv) == 1:
        _selfcheck()
    elif sys.argv[1] == "--which":
        print(describe())
    else:
        data = json.loads(Path("clips.json").read_text(encoding="utf-8"))
        print(f"using {describe()}")
        plan = direct(data["clips"], " ".join(sys.argv[1:]))
        Path("shotplan.md").write_text(render_plan(plan), encoding="utf-8")
        print(render_plan(plan))
