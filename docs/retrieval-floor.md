# The relevance floor belongs to the model

*Moved from the README on 27 Oct 2026. It is for whoever changes the embedding model or `OFFICE_MIN_SIM`.*

**The floor is absolute, so it belongs to the model.** `OFFICE_MIN_SIM` is a raw cosine cut-off, and different models give unrelated text very different scores. Two models cannot share one floor. The numbers below come from 16 real notes on this machine, 14 answerable and 8 unanswerable queries, on the CPU, through the same `encode()` the sidecar uses.

| model | right note scores | a question with no answer scores | usable floor |
|---|---|---|---|
| `all-MiniLM-L6-v2`, the default | 0.30 to 0.73 | 0.14 or less | **0.25 to 0.30** |
| `BAAI/bge-small-en-v1.5` | 0.57 to 0.86 | up to 0.59 | about 0.59 |

bge-small ranks no better here. It put the right note first for 12 of 14 queries, against 13 of 14 for MiniLM. It also pushes every score upward, so at the default floor of `0.30` it answered every nonsense query with eight vector hits. That breaks the rule that an empty result is real. A query-side instruction prefix does not bring the gap back. It lowers the right note to 0.57 while nonsense stays at 0.59.

If you switch models, re-tune `OFFICE_MIN_SIM` in the same change and re-embed every note. An embedding does not record which model made it. A store with embeddings from two models compares two different vector spaces and returns wrong similarities without any error.
