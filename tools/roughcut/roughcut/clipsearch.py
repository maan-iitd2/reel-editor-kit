"""Semantic footage search: find frames by describing them.

CLIP embeds images and text into the same space, so cosine similarity between
"hand holding the connector" and a frame is a usable relevance score.

Runs on onnxruntime with no torch. That is the whole reason this file exists in
this shape — every torch-based CLIP wrapper is unusable on this machine (Smart
App Control blocks torch's unsigned DLLs, and installing it breaks
faster-whisper). onnxruntime here is CPU-only, which is fine: ViT-B/32 is a few
tens of milliseconds per frame.
"""
import json
from pathlib import Path

REPO = "Xenova/clip-vit-base-patch32"
VISION = "onnx/model.onnx"          # full CLIP: takes pixels AND token ids
SIZE = 224                          # ViT-B/32 input resolution
CTX = 77                            # CLIP's fixed text context length
_MEAN = (0.48145466, 0.4578275, 0.40821073)
_STD = (0.26862954, 0.26130258, 0.27577711)
_session = None
_tokenizer = None


def _onnx_path() -> Path:
    from huggingface_hub import hf_hub_download
    return Path(hf_hub_download(REPO, VISION))


def _load():
    """(session, tokenizer). Downloads ~600MB once, then reads from HF cache."""
    global _session, _tokenizer
    if _session is None:
        import onnxruntime as ort
        from huggingface_hub import hf_hub_download
        from tokenizers import Tokenizer
        onnx_path = _onnx_path()
        _tokenizer = Tokenizer.from_file(hf_hub_download(REPO, "tokenizer.json"))
        _tokenizer.enable_padding(length=CTX, pad_id=0, pad_token="!")
        _tokenizer.enable_truncation(max_length=CTX)
        opts = ort.SessionOptions()
        opts.log_severity_level = 3
        _session = ort.InferenceSession(str(onnx_path), opts,
                                        providers=["CPUExecutionProvider"])
    return _session, _tokenizer


def _preprocess(path):
    """Image file -> (1,3,224,224) float32, CLIP-normalised."""
    import numpy as np
    from PIL import Image
    img = Image.open(path).convert("RGB")
    # Resize short side then centre crop, matching CLIP's own preprocessing.
    w, h = img.size
    scale = SIZE / min(w, h)
    img = img.resize((max(SIZE, round(w * scale)), max(SIZE, round(h * scale))),
                     Image.BICUBIC)
    w, h = img.size
    left, top = (w - SIZE) // 2, (h - SIZE) // 2
    img = img.crop((left, top, left + SIZE, top + SIZE))
    a = np.asarray(img, dtype="float32") / 255.0
    a = (a - np.array(_MEAN, dtype="float32")) / np.array(_STD, dtype="float32")
    return a.transpose(2, 0, 1)[None, ...]


def _norm(v):
    import numpy as np
    return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-9)


def embed(image_paths: list, texts: list):
    """-> (image_vectors, text_vectors), both L2-normalised.

    The exported graph is the full CLIP model, so it wants pixels and token ids
    in the same call. We pass real values for whichever side we need and a
    harmless placeholder for the other, then keep only the half we asked for.
    """
    import numpy as np
    session, tok = _load()
    imgs = np.concatenate([_preprocess(p) for p in image_paths]) if image_paths \
        else np.zeros((1, 3, SIZE, SIZE), dtype="float32")
    encs = [tok.encode(t) for t in (texts or [""])]
    ids = np.array([e.ids[:CTX] for e in encs], dtype="int64")
    mask = np.array([e.attention_mask[:CTX] for e in encs], dtype="int64")

    # Tile with modular indexing, never np.repeat: repeat gives [a,a,b] where
    # tiling gives [a,b,a], so with 3 images and 2 texts the second text's
    # embedding would silently be a duplicate of the first.
    n = max(len(imgs), len(ids))
    take = lambda a: a[np.arange(n) % len(a)]
    feed = {"pixel_values": take(imgs), "input_ids": take(ids),
            "attention_mask": take(mask)}
    out = session.run(None, feed)
    names = [o.name for o in session.get_outputs()]
    img_e = out[names.index("image_embeds")][:len(image_paths) or 0]
    txt_e = out[names.index("text_embeds")][:len(texts) or 0]
    return _norm(img_e) if len(img_e) else img_e, _norm(txt_e) if len(txt_e) else txt_e


def build_index(frames: list, index_path) -> dict:
    """frames: [{"path","file","t"}] -> index dict, also written to disk."""
    vecs, _ = embed([f["path"] for f in frames], [])
    index = {"frames": [dict(f, vec=v.tolist()) for f, v in zip(frames, vecs)]}
    Path(index_path).write_text(json.dumps(index), encoding="utf-8")
    return index


def search(query: str, index: dict, top: int = 12) -> list:
    """-> [{"file","t","path","score"}] ranked, best first."""
    import numpy as np
    if not index.get("frames"):
        return []
    _, txt = embed([], [query])
    mat = np.array([f["vec"] for f in index["frames"]], dtype="float32")
    scores = mat @ txt[0]
    order = np.argsort(-scores)[:top]
    return [{k: index["frames"][i][k] for k in ("file", "t", "path")}
            | {"score": round(float(scores[i]), 4)} for i in order]


def _selfcheck() -> None:
    """Proves CLIP actually discriminates, using images we generate here."""
    import subprocess
    import tempfile
    import numpy as np

    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        # Two visually unmistakable images; no fixture files needed.
        for name, spec in (("red", "color=red:s=224x224"),
                           ("blue", "color=blue:s=224x224")):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                            "-i", spec, "-frames:v", "1", str(d / f"{name}.png")],
                           check=True)
        vecs, _ = embed([str(d / "red.png"), str(d / "blue.png")], [])
        assert vecs.shape[0] == 2, vecs.shape
        assert abs(np.linalg.norm(vecs[0]) - 1.0) < 1e-3      # L2-normalised

        _, txts = embed([], ["a photo of something red", "a photo of something blue"])
        assert txts.shape[0] == 2, txts.shape

        # The red image must score higher against "red" than the blue one does.
        red_to_red = float(vecs[0] @ txts[0])
        blue_to_red = float(vecs[1] @ txts[0])
        assert red_to_red > blue_to_red, (red_to_red, blue_to_red)
        # ...and symmetrically for blue. Both directions, or it could be luck.
        assert float(vecs[1] @ txts[1]) > float(vecs[0] @ txts[1])

        # search() ranks and returns the expected shape.
        idx = build_index([{"path": str(d / "red.png"), "file": "r.mp4", "t": 1.0},
                           {"path": str(d / "blue.png"), "file": "b.mp4", "t": 2.0}],
                          d / "i.json")
        hits = search("something red", idx, top=2)
        assert hits[0]["file"] == "r.mp4", hits
        assert hits[0]["score"] > hits[1]["score"]
        assert search("anything", {"frames": []}) == []

        # Mismatched counts must not duplicate a row. With 2 images and 2 very
        # different texts the two text vectors have to differ; the old
        # np.repeat path returned the first text twice whenever images > texts.
        _, two = embed([str(d / "red.png"), str(d / "blue.png")],
                       ["a red square", "a blue square"])
        assert two.shape[0] == 2
        assert float(two[0] @ two[1]) < 0.999, "text rows collapsed to one"
    print("clipsearch selfcheck OK")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] != "--selfcheck":
        idx = json.loads(Path("clip_index.json").read_text(encoding="utf-8"))
        for h in search(" ".join(sys.argv[1:]), idx):
            print(f"  {h['score']:.3f}  {h['file']} @ {h['t']:.1f}s")
    else:
        _selfcheck()
