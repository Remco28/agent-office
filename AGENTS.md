# Agent Office

Shared working memory on this machine. Not a personality. Not source control.

Two records live in one file: **memories** (decisions and conventions, found by meaning) and a **work log** (what agents did here, read by time). The log exists so the next agent can pick up where this one stopped.

## Start here

```bash
office begin --project ~/Projects/the-thing --by freebuff
```

This records the target for the session and returns what you need first: the tools this machine has, preferences that apply everywhere, work nobody finished, and the memories for this project. Every later command inherits the project.

Nothing is inferred from the working directory — you are usually started in the office itself. If no project is declared, say so instead of guessing: `office begin` tells you.

## Tools

`begin` returns the tool list. Treat it as the truth about what is installed here and how to call it, and prefer a listed tool over a built-in one.

```bash
office tools add rg --use "rg 'pattern' -t ts" "fast local search"
office tools                # what this machine has
office tools remove rg
```

## The work log

Append-only. Nothing is ever edited, and "done" is not a status — it is the presence of a closing line. So write as you go, not when you finish.

```bash
office work open "auth refactor"          # returns an id
office work note 7 "login.ts done, reset.ts next"
office work close 7 "finished"
office work                              # what is unfinished for this project
office work log --all --limit 20         # the trail, newest first
```

- **`office work note` is the handoff.** You will not know when you are about to run out of context. Write the note while you still know where you are.
- Close work when it is finished, even if another agent opened it.
- A note says where you got to, not every file you touched.
- If you are resuming, `office work` + the last note on the item tells you where the previous agent stopped.

## Memories

```bash
office context "add rate limiting to checkout"   # before starting
office search "checkout rate limit"              # one specific fact
office remember --tag convention "60 req/min per IP, enforced in src/server/checkout.ts"
office remember --global "prefers tabs, four spaces wide"   # applies to every project
office forget 12                                # delete a wrong memory
```

Store decisions and why, conventions, things you tried that failed, and facts the next agent would otherwise rediscover.

Do not store secrets or `.env` contents, large source dumps, session transcripts, progress chatter (that belongs in the work log), or guesses you would not want retrieved later.

An empty result is real: there is nothing above the relevance floor. Do not lower the floor to find something.

## House rules

- JSON is the default output. Parse it.
- Humans open the desk with bare `office`. Do not run the desk from an agent session.
- This file belongs only in folders that should use the office. Never in `$HOME`.
- `office list --limit 20` and `office status` exist when you need them.
