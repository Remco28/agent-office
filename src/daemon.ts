import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { baseUrl, dataDir, pidPath, ROOT } from "./paths";

export async function health(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${baseUrl()}/health`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function writePid(pid: number): void {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(pidPath(), String(pid));
}

export function readPid(): number | null {
  if (!existsSync(pidPath())) return null;
  const n = Number(readFileSync(pidPath(), "utf8").trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function startDetach(): Promise<void> {
  if (await health()) return;
  const child = Bun.spawn({
    cmd: ["bun", `${ROOT}/src/index.ts`, "serve"],
    cwd: ROOT,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: process.env,
    // setsid(): the daemon gets its own session/process group, so it is not
    // killed when the shell that started it tears its process group down.
    // Without this the daemon dies with every invoking shell and each call
    // pays a full embedder reload.
    detached: true,
  });
  writePid(child.pid);
  child.unref();
}

export async function waitForHealth(tries = 80): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < tries; i++) {
    await Bun.sleep(100);
    const h = await health();
    if (h) return h;
  }
  return null;
}

export async function stopDaemon(): Promise<boolean> {
  const was = Boolean(await health());
  const pid = readPid();
  if (pid && pidAlive(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
  try {
    unlinkSync(pidPath());
  } catch {
    // ignore
  }
  for (let i = 0; i < 30; i++) {
    if (!(await health())) return was;
    await Bun.sleep(100);
  }
  return was;
}

export async function restartDaemon(): Promise<Record<string, unknown> | null> {
  await stopDaemon();
  await startDetach();
  return waitForHealth();
}

export async function ensureDaemon(): Promise<void> {
  if (await health()) return;
  await startDetach();
  if (await waitForHealth()) return;
  throw new Error("office daemon failed to start; try `office serve` in the foreground");
}

export async function checkpointViaApi(): Promise<void> {
  const res = await fetch(`${baseUrl()}/checkpoint`, { method: "POST" });
  if (!res.ok) throw new Error("checkpoint failed");
}
