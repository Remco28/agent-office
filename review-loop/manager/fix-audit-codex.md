### Finding

- [review-loop/naming/PLAN.md](/home/frank/Projects/agent-office/review-loop/naming/PLAN.md:7) and [line 54](/home/frank/Projects/agent-office/review-loop/naming/PLAN.md:54): The plan still describes `role` as part of the current session schema and says roles are unchanged, with the manager removal planned for later. Someone using it as current guidance could wrongly expect the manager role to exist. **LOW**.

I found no runtime breakage in the removed callers or SQL. `src/tui.ts` and `src/stats.ts` have no remaining role readers; the session queries and writes omit the column, and the legacy `id`-shape migration still copies sessions without it. Issue handling remains documented for agents working in this repository.
