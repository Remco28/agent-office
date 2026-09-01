#!/usr/bin/env python3
"""JSONL stdin/stdout embedder. Loads MiniLM once, then encodes line by line."""

from __future__ import annotations

import json
import sys
from math import sqrt

MODEL_NAME = sys.argv[1] if len(sys.argv) > 1 else "all-MiniLM-L6-v2"


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def normalize(values: list[float]) -> list[float] | None:
    norm = sqrt(sum(v * v for v in values))
    if norm <= 0:
        return None
    return [v / norm for v in values]


def load_model():
    from sentence_transformers import SentenceTransformer

    try:
        return SentenceTransformer(MODEL_NAME, local_files_only=True)
    except Exception as exc:
        log(f"local load failed ({exc}); trying download")
        return SentenceTransformer(MODEL_NAME)


def ready(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def main() -> int:
    try:
        model = load_model()
    except Exception as exc:
        ready({"ok": False, "error": str(exc)})
        return 1

    dim = int(getattr(model, "get_sentence_embedding_dimension", lambda: 384)())
    ready({"ok": True, "model": MODEL_NAME, "dim": dim})

    for raw in sys.stdin:
        line = raw.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            req_id = str(msg.get("id") or "")
            text = str(msg.get("text") or "").strip()
            if not req_id:
                continue
            if not text:
                ready({"id": req_id, "error": "empty text"})
                continue
            vector = model.encode(text, normalize_embeddings=True)
            values = vector.tolist() if hasattr(vector, "tolist") else list(vector)
            if values and isinstance(values[0], (list, tuple)):
                values = list(values[0])
            values = [float(v) for v in values]
            normalized = normalize(values)
            if normalized is None:
                ready({"id": req_id, "error": "zero vector"})
                continue
            ready({"id": req_id, "embedding": normalized})
        except Exception as exc:
            req_id = ""
            try:
                req_id = str(json.loads(line).get("id") or "")
            except Exception:
                pass
            ready({"id": req_id, "error": str(exc)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
