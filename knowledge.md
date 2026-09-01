# Agent Office

This machine has a shared working memory for coding agents. Not a personality. Not source control.

Use it for decisions, conventions, pitfalls, and handoff notes that should survive a new agent or a new session.

At the start of a task:

```bash
office context "<what you are about to do>"
```

When a decision lands:

```bash
office remember --tag convention --source freebuff "<the fact>"
```

When you need a specific fact:

```bash
office search "<query>"
```

JSON comes back. Parse it. Do not dump the whole store into the prompt.

Do not store secrets, `.env` contents, source dumps, or full transcripts.
If a memory is wrong: `office forget <id>`, then remember the correction.

The CLI starts the daemon if it is down. Humans type `office` for the desk TUI — you should not.
