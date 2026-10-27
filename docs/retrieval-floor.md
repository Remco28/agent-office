# The relevance floor belongs to the model

*Moved from the README on 27 Oct 2026: it is for whoever changes the embedding model or `OFFICE_MIN_SIM`.*

**The floor is absolute, so it belongs to the model.** `OFFICE_MIN_SIM` is a raw cosine cut-off, and models place unrelated text at very different scores — so "a better model" and "this model" cannot share one floor. Measured on 16 real notes from this machine with 14 answerable and 8 unanswerable queries, CPU, via the same `encode()` the sidecar uses:

| model | right note scores | a question with no answer scores | usable floor |
|---|---|---|---|
| `all-MiniLM-L6-v2` (default) | 0.30 – 0.73 | ≤ 0.14 | **0.25 – 0.30** |
| `BAAI/bge-small-en-v1.5` | 0.57 – 0.86 | up to 0.59 | ~0.59 |

bge-small ranks no better here (12/14 first place against 13/14) and compresses *everything* upward, so at the default `0.30` it answered every nonsense query with eight confident vector hits — the "an empty result is real" contract inverted. A query-side instruction prefix does not restore the separation (it lowers the right note to 0.57 while nonsense stays at 0.59). If you do switch models, re-tune `OFFICE_MIN_SIM` in the same change and re-embed: embeddings carry no record of the model that made them, so a half-switched store compares two vector spaces and returns quietly wrong similarities rather than crashing.
