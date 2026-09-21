import { openDb } from "./db";
import { startSidecar, type Embedder } from "./embed";
import {
  backfillEmbeddings,
  countMemories,
  forget,
  listMemories,
  remember,
  searchDetailed,
} from "./memory";
import { briefing, getActive, resolveScope, setActive } from "./session";
import { closeWork, getWork, listWork, noteWork, openWork } from "./work";
import { listTools, removeTool, upsertTool } from "./tools";
import { fileStats, embedderState, queryStore, warningsFor, type Warning } from "./stats";
import { dbPath, MODEL_NAME, port } from "./paths";

export type Office = {
  stop: () => void;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fail(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  return json({ error: message }, 400);
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function serve(opts?: { embedder?: Embedder; port?: number }): Office {
  const db = openDb();
  const embedder = opts?.embedder ?? startSidecar();
  const listen = opts?.port ?? port();
  const startedAt = new Date().toISOString();

  const backfill = async () => {
    try {
      await backfillEmbeddings(db, embedder);
    } catch (err) {
      console.error("office backfill:", err);
    }
  };

  const waitReady = async () => {
    for (let i = 0; i < 200; i++) {
      if (embedder.ready) {
        await backfill();
        return;
      }
      await Bun.sleep(100);
    }
  };
  void waitReady();

  const warnings = (): Warning[] => {
    const state = embedderState({
      daemonUp: true,
      ready: embedder.ready,
      startedAt,
    });
    return warningsFor({
      daemonUp: true,
      embedder: state,
      store: { ...fileStats(dbPath()), ...queryStore(db) },
    });
  };

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: listen,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      if (req.method === "GET" && (path === "/health" || path === "/status" || path === "/")) {
        const files = fileStats(dbPath());
        const stats = queryStore(db);
        const active = getActive(db);
        return json({
          ok: true,
          name: "agent-office",
          memories: countMemories(db),
          missing_embeddings: stats.missingEmbeddings,
          last_write: stats.lastWrite,
          work: { open: stats.workOpen, total: stats.workTotal },
          tools: stats.tools,
          log_chars: stats.logChars,
          active: active
            ? { project: active.project, author: active.author, since: active.updated_at }
            : null,
          embedder: embedder.ready,
          model: MODEL_NAME,
          port: listen,
          pid: process.pid,
          started_at: startedAt,
          db: files,
        });
      }

      if (req.method === "POST" && path === "/checkpoint") {
        db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
        return json({ ok: true, db: fileStats(dbPath()) });
      }

      if (req.method === "GET" && path === "/list") {
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const project = url.searchParams.get("project");
        return json({
          memories: project
            ? listMemories(db, limit, project)
            : listMemories(db, limit),
        });
      }

      if (req.method === "POST" && path === "/begin") {
        const body = await readBody(req);
        const project = str(body.project);
        const author = str(body.author);
        // Naming a target is the one declaration a session makes. Everything
        // after this inherits it; nothing is inferred from the working dir.
        if (project || author) setActive(db, { project, author });
        const result = await briefing(db, embedder);
        return json({
          ...result,
          // this call is what named them, so report it that way
          project_source: project ? "declared" : result.project_source,
          author_source: author ? "declared" : result.author_source,
          warnings: warnings(),
        });
      }

      if (req.method === "POST" && path === "/remember") {
        const body = await readBody(req);
        const content = String(body.content ?? "").trim();
        if (!content) return json({ error: "content required" }, 400);
        const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : [];
        const scope = resolveScope(db, {
          project: str(body.project),
          author: str(body.author),
        });
        try {
          const memory = await remember(db, embedder, {
            content,
            tags,
            project: scope.project,
            author: scope.author,
            scope: str(body.scope),
            source: str(body.source),
          });
          void backfill();
          return json({
            ok: true,
            memory,
            project_source: scope.project_source,
            author_source: scope.author_source,
          });
        } catch (err) {
          return fail(err);
        }
      }

      if (req.method === "POST" && path === "/search") {
        const body = await readBody(req);
        const q = String(body.q ?? body.query ?? "");
        const limit = Number(body.limit ?? 8);
        const project = str(body.project);
        const scope = resolveScope(db, { project });
        const result = await searchDetailed(db, embedder, q, limit, {
          project: scope.project,
        });
        return json({
          ...result,
          project_source: scope.project_source,
          note: result.hits.length
            ? null
            : result.searched
              ? `nothing relevant — ${result.searched} memories in scope`
              : "nothing stored yet",
        });
      }

      if (req.method === "POST" && path === "/context") {
        const body = await readBody(req);
        const q = String(body.q ?? body.query ?? "");
        const limit = Number(body.limit ?? 8);
        const scope = resolveScope(db, { project: str(body.project) });
        const result = await searchDetailed(db, embedder, q, limit, {
          project: scope.project,
        });
        return json({
          ...result,
          project_source: scope.project_source,
          note: result.hits.length
            ? null
            : result.searched
              ? `nothing relevant — ${result.searched} memories in scope`
              : "nothing stored yet",
        });
      }

      if (req.method === "POST" && path === "/forget") {
        const body = await readBody(req);
        const id = Number(body.id);
        if (!Number.isInteger(id) || id <= 0) return json({ error: "id required" }, 400);
        return json({ ok: forget(db, id), id });
      }

      if (req.method === "GET" && path === "/tools") {
        return json({ tools: listTools(db) });
      }

      if (req.method === "POST" && path === "/tools") {
        const body = await readBody(req);
        try {
          const tool = upsertTool(db, {
            name: String(body.name ?? ""),
            summary: String(body.summary ?? ""),
            usage: str(body.usage),
            notes: str(body.notes),
          });
          return json({ ok: true, tool });
        } catch (err) {
          return fail(err);
        }
      }

      if (req.method === "POST" && path === "/tools/remove") {
        const body = await readBody(req);
        return json({ ok: removeTool(db, String(body.name ?? "")), name: body.name });
      }

      if (req.method === "GET" && path === "/work") {
        const scope = resolveScope(db, { project: url.searchParams.get("project") });
        return json({
          work: listWork(db, {
            project: scope.project,
            includeClosed: url.searchParams.get("all") === "1",
            limit: Number(url.searchParams.get("limit") ?? 20),
          }),
          project: scope.project,
          project_source: scope.project_source,
        });
      }

      if (req.method === "POST" && path === "/work/open") {
        const body = await readBody(req);
        const scope = resolveScope(db, {
          project: str(body.project),
          author: str(body.author),
        });
        try {
          const item = openWork(db, {
            title: String(body.title ?? ""),
            project: scope.project,
            author: scope.author,
          });
          return json({ ok: true, work: item, project_source: scope.project_source });
        } catch (err) {
          return fail(err);
        }
      }

      if (req.method === "POST" && path === "/work/note") {
        const body = await readBody(req);
        try {
          const item = noteWork(db, Number(body.id), {
            text: String(body.text ?? ""),
            author: str(body.author) ?? resolveScope(db, {}).author,
          });
          return json({ ok: true, work: item });
        } catch (err) {
          return fail(err);
        }
      }

      if (req.method === "POST" && path === "/work/close") {
        const body = await readBody(req);
        try {
          const item = closeWork(db, Number(body.id), {
            text: str(body.text) ?? undefined,
            author: str(body.author) ?? resolveScope(db, {}).author,
          });
          return json({ ok: true, work: item });
        } catch (err) {
          return fail(err);
        }
      }

      if (req.method === "POST" && path === "/work/get") {
        const body = await readBody(req);
        return json({ work: getWork(db, Number(body.id)) });
      }

      return json({ error: "not found" }, 404);
    },
  });

  console.error(`office listening on 127.0.0.1:${server.port}`);

  return {
    stop() {
      embedder.close();
      server.stop(true);
      db.close();
    },
  };
}
