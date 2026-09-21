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
  source?: string;
  limit?: number;
  detach?: boolean;
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
    else if (a === "--tag" || a === "-t") {
      const value = args.shift();
      if (value) opts.tags.push(value);
    } else if (a === "--source" || a === "-s") {
      opts.source = args.shift();
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

function help(): string {
  return `agent-office — local working memory for coding agents

  office                      open the desk (status, sizes, start/stop/fix)
  office serve [--detach]     start the localhost daemon
  office status               daemon health (JSON)
  office stop                 stop the daemon

  office context [query]      memories for this task (recent if no query)
  office remember [--tag t] [--source s] <text>
  office search <query>
  office list [--limit n]
  office forget <id>

JSON is the default for agent commands. Pass --text for a short listing.
Daemon binds 127.0.0.1:${port()}. Data: ${dataDir()}
`;
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

  if (cmd === "remember") {
    let content = opts.rest.join(" ").trim();
    if (!content && !process.stdin.isTTY) {
      content = (await Bun.stdin.text()).trim();
    }
    if (!content) throw new Error("usage: office remember [--tag t] [--source s] <text>");
    const data = (await api("/remember", {
      method: "POST",
      body: {
        content,
        tags: opts.tags,
        source: opts.source ?? process.env.OFFICE_SOURCE ?? null,
      },
    })) as { memory: { id: number; content: string; tags: string[] } };
    printJson(data);
    return 0;
  }

  if (cmd === "search") {
    const q = opts.rest.join(" ").trim();
    if (!q) throw new Error("usage: office search <query>");
    const data = (await api("/search", {
      method: "POST",
      body: { q, limit: opts.limit ?? 8 },
    })) as {
      hits: Array<{
        id: number;
        content: string;
        tags: string[];
        created_at: string;
        score: number;
      }>;
    };
    if (asText) printHits(data.hits);
    else printJson(data);
    return 0;
  }

  if (cmd === "context") {
    const q = opts.rest.join(" ").trim();
    const data = (await api("/context", {
      method: "POST",
      body: { q, limit: opts.limit ?? 8 },
    })) as {
      memories: Array<{
        id: number;
        content: string;
        tags: string[];
        created_at: string;
        score?: number;
      }>;
    };
    if (asText) printHits(data.memories);
    else printJson(data);
    return 0;
  }

  if (cmd === "list") {
    const data = (await api(`/list?limit=${opts.limit ?? 20}`)) as {
      memories: Array<{ id: number; content: string; tags: string[]; created_at: string }>;
    };
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

  throw new Error(`unknown command: ${cmd}\n${help()}`);
}
