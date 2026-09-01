# Agent Office

Shared working memory on this machine. Not a personality. Not source control.

Use it for decisions, conventions, pitfalls, and handoff notes that should survive a new agent or a new session.

## Setup

```bash
office status
# if the daemon is down:
office serve --detach
```

The CLI starts the daemon on first use if needed. It listens on `127.0.0.1` only.

## Three verbs

At the start of a task:

```bash
office context "add rate limiting to checkout"
```

When a decision lands:

```bash
office remember --tag convention --source $AGENT_NAME "Checkout rate limit lives in src/server/checkout.ts; 60 req/min per IP."
```

When you need a specific fact:

```bash
office search "checkout rate limit"
```

JSON is the default output. Parse it. Do not dump the whole store into the prompt — `context` already ranked a small set.

## What to store

Store:

- decisions and why
- conventions for this machine / these repos
- things you tried that failed
- short handoff notes for the next agent

Do not store:

- secrets, tokens, `.env` contents
- large source dumps
- transcripts of a whole session
- guesses you would not want retrieved later

If a memory is wrong: `office forget <id>`, then remember the correction.

## Optional

```bash
office list --limit 20
office forget 12
```
