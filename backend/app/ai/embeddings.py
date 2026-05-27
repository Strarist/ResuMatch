"""Local embedding service using sentence-transformers.

Model: all-MiniLM-L6-v2 (22M params, 80MB, 384-dim embeddings)
- Runs on CPU in <100ms per batch
- No API costs, no network dependency
- Lazy-loaded on first call to avoid startup penalty

All embeddings are L2-normalized, so cosine similarity = dot product.
"""

from functools import lru_cache

import numpy as np

_model = None


def _get_model():
    """Lazy-load model singleton. ~80MB, loaded once, stays in memory."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


import asyncio

def _embed_sync(texts: list[str]) -> np.ndarray:
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = _get_model()
    return model.encode(texts, normalize_embeddings=True, batch_size=64).astype(np.float32)

async def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed multiple texts without blocking the event loop. Returns (N, 384) normalized float32 array."""
    return await asyncio.to_thread(_embed_sync, texts)


async def embed_text(text: str) -> np.ndarray:
    """Embed a single text without blocking the event loop. Returns (384,) normalized float32 vector."""
    res = await embed_texts([text])
    return res[0]
