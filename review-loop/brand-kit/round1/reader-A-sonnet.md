# Reader A (Claude Sonnet): new brand from scratch (sourdough bakery)
Verdict: worked, mostly. Could act in every phase.
Best rules: one small set of questions at a time with a recommended answer; rules 1, 2, 4 (show side by side, one variable, take the gut); "make one test image before planning around it".
Broken (sure):
1. No fallback when image generation is missing: phase 0 tests it, phases 2 and 9 assume it; nothing says what to do if the test fails.
2. Print: SKILL phase 1 and prompts.md ask about print, checklist has nothing to build or check for it (evidence.md admits it). A bakery's first real use is likely a label or bag.
3. Photo base prompt fixes "No people, no hands" and "calm, minimal"; a food brand would want bread and hands. Would have to rewrite exclusions.
No contradictions between files.
One change: a two-line fallback in phase 0 if the test image fails (hand-built SVG/HTML boards; a shot list for a real photographer).
Losing track: not for the agent (numbered phases, goals). The human may lose track over phases 4-7: open each round by naming the phase and what comes after.
Phase 7 packs ~10 deliverables in one list; checklist.md covers it.
