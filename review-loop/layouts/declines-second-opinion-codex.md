1. **AGREE** — `/status` includes the session list, and the desk uses its newest row as the active display ([server.ts](/home/frank/Projects/agent-office/src/server.ts:157), [tui.ts](/home/frank/Projects/agent-office/src/tui.ts:97)).

2. **AGREE** — The affected layouts are explicitly out of scope here, and the checked stored keys showed no matching old paths; unmapped keys are preserved ([scope.ts](/home/frank/Projects/agent-office/src/scope.ts:128), [rekey.ts](/home/frank/Projects/agent-office/src/rekey.ts:24)).

3. **AGREE** — Startup logs the unmapped keys and says they were left unchanged, which is a reasonable diagnostic for now ([server.ts](/home/frank/Projects/agent-office/src/server.ts:89)).
