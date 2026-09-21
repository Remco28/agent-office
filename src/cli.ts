import { unlinkSync } from "node:fs";
import {
  ensureDaemon,
  health,
  startDetach,
  stopDaemon,
  waitForHealth,
  writePid,
} from "./daemon";
import { baseUrl, dataDir, pidPath, port } from "./paths";
import { serve } from "./server";
import { runTui } from "./tui";

type Opts = {
  tags: string[];
  project?: string;
  author?: string;
  scope?: string;
  usage?: string;
  notes?: string;
  limit?: number;
  detach?: boolean;
  all?: boolean;
  text?: boolean;
  rest: string[];
};

function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function printHits(
  hits: Array<{ id: number; content: string; tags: string[]; created_at: string; score?: number }>,
): void {
  if (!hits.length) {
    process.stdout.write("(none)\n");
    return;
  }
  for (const hit of hits) {
    const tags = hit.tags.length ? `  [${hit.tags.join(", ")}]` : "";
    process.stdout.write(`#${hit.id}${tags}  ${hit.content}\n`);
  }
}

function parse(argv: string[]): { cmd: string; opts: Opts } {
  const args = argv.slice(2);
  let cmd = args.shift() ?? "tui";
  // `office --help` is a request for help, not the name of a command.
  if (cmd === "--help" || cmd === "-h") cmd = "help";
  const opts: Opts = { tags: [], rest: [] };
  while (args.length) {
    const a = args.shift()!;
    if (a === "--detach") opts.detach = true;
    else if (a === "--text") opts.text = true;
    else if (a === "--all") opts.all = true;
    else if (a === "--global" || a === "--everywhere") opts.scope = "global";
    else if (a === "--tag" || a === "-t") {
      const value = args.shift();
      if (value) opts.tags.push(value);
    } else if (a === "--project" || a === "-p" || a === "--source" || a === "-s") {
      // --source is the old name for --project; the store used one column for both.
      opts.project = args.shift();
    } else if (a === "--by" || a === "-a") {
      opts.author = args.shift();
    } else if (a === "--use") {
      opts.usage = args.shift();
    } else if (a === "--note") {
      opts.notes = args.shift();
    } else if (a === "--limit" || a === "-n") {
      opts.limit = Number(args.shift());
    } else if (a === "--help" || a === "-h") {
      return { cmd: "help", opts };
    } else if (a.startsWith("-")) {
      throw new Error(`unknown flag: ${a}`);
    } else {
      opts.rest.push(a);
    }
  }
  return { cmd, opts };
}

async function api(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : res.statusText;
    throw new Error(err);
  }
  return data;
}

/** What the caller declares. Unset means "use whatever the office remembers". */
function declaredProject(opts: Opts): string | null {
  return opts.project ?? process.env.OFFICE_PROJECT ?? process.env.OFFICE_SOURCE ?? null;
}

function declaredAuthor(opts: Opts): string | null {
  return opts.author ?? process.env.OFFICE_AUTHOR ?? null;
}

function help(): string {
  return `agent-office — local working memory for coding agents

  office begin --project <path> [--by <agent>]
                              start a session: name the target, get the tools,
                              preferences, unfinished work and a briefing
  office context [query]      memories for this task (recent if no query)
  office search <query>       find one specific fact
  office remember [--tag t] [--global] <text>
  office list [--limit n]     recent memories, newest first
  office forget <id>          delete a memory

  office work                 unfinished work for this project
  office work open <title>    start a piece of work
  office work note <id> <text>   append where you got to
  office work close <id> [text]  say it is finished
  office work log [--all]     recent work, newest first

  office tools                what this machine has
  office tools add <name> [--use <cmd>] [--note <text>] <summary>
  office tools remove <name>

  office serve [--detach]     start the localhost daemon
  office status               daemon health (JSON)
  office stop                 stop the daemon
  office                      open the desk (humans)

Flags: --project/-p <path>  --by/-a <agent>  --tag/-t <tag>  --global  --limit/-n <n>
--project and --by replace what the office remembers. Pass neither to just read.
JSON is the default for agent commands. Pass --text for a short listing.
Daemon binds 127.0.0.1:${port()}. Data: ${dataDir()}
`;
}

type Hit = {
  id: number;
  content: string;
  tags: string[];
  created_at: string;
  score?: number;
  similarity?: number | null;
  via?: string;
};

function printBriefing(data: {
  project: string | null;
  project_source?: string;
  author: string | null;
  tools: Array<{ name: string; summary: string; usage: string | null }>;
  preferences: Hit[];
  open_work: Array<{ id: number; title: string; last_note: string | null }>;
  memories: Hit[];
}): void {
  const out: string[] = [];
  out.push(`project  ${data.project ?? "(none declared)"}`);
  out.push(`author   ${data.author ?? "(unknown)"}`);
  if (data.tools.length) {
    out.push("", "tools");
    for (const tool of data.tools) {
      out.push(`  ${tool.name}  ${tool.summary}${tool.usage ? `  (${tool.usage})` : ""}`);
    }
  }
  if (data.preferences.length) {
    out.push("", "everywhere");
    for (const memory of data.preferences) out.push(`  #${memory.id}  ${memory.content}`);
  }
  if (data.open_work.length) {
    out.push("", "unfinished");
    for (const item of data.open_work) {
      out.push(`  #${item.id}  ${item.title}${item.last_note ? `  — ${item.last_note}` : ""}`);
    }
  }
  out.push("", "memories");
  if (!data.memories.length) out.push("  (none)");
  for (const memory of data.memories) {
    out.push(`  #${memory.id}  ${memory.content}`);
  }
  process.stdout.write(out.join("\n") + "\n");
}

export async function main(argv = process.argv): Promise<number> {
  const { cmd, opts } = parse(argv);
  const asText = Boolean(opts.text);

  if (cmd === "help") {
    process.stdout.write(help());
    return 0;
  }

  if (cmd === "tui" || cmd === "desk") {
    return runTui();
  }

  if (cmd === "serve") {
    if (opts.detach) {
      if (await health()) {
        printJson(await health());
        return 0;
      }
      await startDetach();
      const h = await waitForHealth();
      if (h) {
        printJson(h);
        return 0;
      }
      throw new Error("detached office failed to become healthy");
    }
    writePid(process.pid);
    const office = serve();
    const shutdown = () => {
      office.stop();
      try {
        unlinkSync(pidPath());
      } catch {
        // ignore
      }
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    await new Promise(() => {});
    return 0;
  }

  if (cmd === "status") {
    const h = await health();
    if (!h) {
      printJson({ ok: false, error: "daemon not running" });
      return 1;
    }
    printJson(h);
    return 0;
  }

  if (cmd === "stop") {
    const was = await stopDaemon();
    printJson({ ok: true, was_running: was });
    return 0;
  }

  await ensureDaemon();

  if (cmd === "begin") {
    const data = (await api("/begin", {
      method: "POST",
      body: { project: declaredProject(opts), author: declaredAuthor(opts) },
    })) as Parameters<typeof printBriefing>[0];
    if (asText) printBriefing(data);
    else printJson(data);
    return 0;
  }

  if (cmd === "remember") {
    let content = opts.rest.join(" ").trim();
    if (!content && !process.stdin.isTTY) {
      content = (await Bun.stdin.text()).trim();
    }
    if (!content) {
      throw new Error("usage: office remember [--tag t] [--project p] <text>");
    }
    const data = await api("/remember", {
      method: "POST",
      body: {
        content,
        tags: opts.tags,
        project: declaredProject(opts),
        author: declaredAuthor(opts),
        scope: opts.scope ?? null,
      },
    });
    printJson(data);
    return 0;
  }

  if (cmd === "search" || cmd === "context") {
    const q = opts.rest.join(" ").trim();
    if (cmd === "search" && !q) throw new Error("usage: office search <query>");
    const data = (await api(`/${cmd}`, {
      method: "POST",
      body: {
        q,
        limit: opts.limit ?? 8,
        project: declaredProject(opts),
      },
    })) as { hits: Hit[] };
    if (asText) printHits(data.hits);
    else printJson(data);
    return 0;
  }

  if (cmd === "list") {
    const query = opts.project ? `?project=${encodeURIComponent(opts.project)}&` : "?";
    const data = (await api(
      `/list${query}limit=${opts.limit ?? 20}`,
    )) as { memories: Hit[] };
    if (asText) printHits(data.memories);
    else printJson(data);
    return 0;
  }

  if (cmd === "forget") {
    const id = Number(opts.rest[0]);
    if (!Number.isInteger(id) || id <= 0) throw new Error("usage: office forget <id>");
    const data = (await api("/forget", { method: "POST", body: { id } })) as {
      ok: boolean;
      id: number;
    };
    printJson(data);
    if (!data.ok) {
      process.stderr.write(`no memory #${id}\n`);
      return 1;
    }
    return 0;
  }

  if (cmd === "work") {
    const sub = opts.rest[0] ?? "list";
    if (sub === "list" || sub === "log") {
      const all = sub === "log" || opts.all ? "1" : "0";
      const params = new URLSearchParams({ all, limit: String(opts.limit ?? 20) });
      if (opts.project) params.set("project", opts.project);
      const data = (await api(`/work?${params}`)) as {
        work: Array<{ id: number; title: string; last_note: string | null; closed: boolean }>;
        project: string | null;
      };
      if (asText) {
        if (!data.work.length) process.stdout.write("(none)\n");
        for (const item of data.work) {
          const mark = item.closed ? "x" : " ";
          process.stdout.write(`[${mark}] #${item.id}  ${item.title}\n`);
        }
      } else {
        printJson(data);
      }
      return 0;
    }
    if (sub === "open") {
      const title = opts.rest.slice(1).join(" ").trim();
      if (!title) throw new Error("usage: office work open <title>");
      printJson(
        await api("/work/open", {
          method: "POST",
          body: { title, project: declaredProject(opts), author: declaredAuthor(opts) },
        }),
      );
      return 0;
    }
    if (sub === "note" || sub === "close") {
      const id = Number(opts.rest[1]);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`usage: office work ${sub} <id> ${sub === "note" ? "<text>" : "[text]"}`);
      }
      const text = opts.rest.slice(2).join(" ").trim();
      if (sub === "note" && !text) throw new Error("usage: office work note <id> <text>");
      printJson(
        await api(`/work/${sub}`, {
          method: "POST",
          body: { id, text, author: declaredAuthor(opts) },
        }),
      );
      return 0;
    }
    throw new Error(`unknown work command: ${sub}\n${help()}`);
  }

  if (cmd === "tools") {
    const sub = opts.rest[0];
    if (!sub) {
      const data = (await api("/tools")) as { tools: unknown[] };
      if (asText) {
        const tools = data.tools as Array<{ name: string; summary: string; usage: string | null }>;
        if (!tools.length) process.stdout.write("(none)\n");
        for (const tool of tools) {
          process.stdout.write(
            `${tool.name}  ${tool.summary}${tool.usage ? `  (${tool.usage})` : ""}\n`,
          );
        }
      } else {
        printJson(data);
      }
      return 0;
    }
    if (sub === "add") {
      const name = opts.rest[1];
      const summary = opts.rest.slice(2).join(" ").trim();
      if (!name || !summary) {
        throw new Error('usage: office tools add <name> [--use <cmd>] "<summary>"');
      }
      printJson(
        await api("/tools", {
          method: "POST",
          body: { name, summary, usage: opts.usage ?? null, notes: opts.notes ?? null },
        }),
      );
      return 0;
    }
    if (sub === "remove" || sub === "rm") {
      const name = opts.rest[1];
      if (!name) throw new Error("usage: office tools remove <name>");
      const data = (await api("/tools/remove", { method: "POST", body: { name } })) as {
        ok: boolean;
        name: string;
      };
      printJson(data);
      if (!data.ok) {
        process.stderr.write(`no tool "${name}"\n`);
        return 1;
      }
      return 0;
    }
    throw new Error(`unknown tools command: ${sub}\n${help()}`);
  }

  throw new Error(`unknown command: ${cmd}\n${help()}`);
}
