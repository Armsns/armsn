import fs from "node:fs";
import path from "node:path";

const UPSTREAM_URL = "https://raw.githubusercontent.com/UseInterstellar/Interstellar-Astro/main/public/assets/json/Games.json";
const LOCAL_PATH = path.resolve("./public/assets/json/Games.json");
const DIST_PATH = path.resolve("./dist/client/assets/json/Games.json");
const STATE_PATH = path.resolve("./.sync-state.json");
const UPSTREAM_BRANCH = "main";
const FETCH_TIMEOUT_MS = 15_000;
const MIN_ENTRY_COUNT = 50;

export type SyncResult =
  | {
      status: "ok";
      bytes: number;
      etag: string;
      durationMs: number;
      entries: number;
    }
  | { status: "not-modified"; etag: string; durationMs: number }
  | {
      status: "error";
      error: string;
      durationMs: number;
      code?: string;
    };

export interface SyncState {
  etag: string | null;
  lastSync: string | null;
  lastStatus: SyncResult["status"] | null;
  lastEntries?: number;
}

let isSyncing = false;

function logSync(timestamp: string, ...parts: string[]) {
  console.log(`[armn-sync] ${timestamp} ${parts.join(" ")}`);
}

function readState(): SyncState {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as Partial<SyncState>;
    return {
      etag: typeof parsed.etag === "string" ? parsed.etag : null,
      lastSync: typeof parsed.lastSync === "string" ? parsed.lastSync : null,
      lastStatus: parsed.lastStatus === "ok" || parsed.lastStatus === "not-modified" || parsed.lastStatus === "error" ? parsed.lastStatus : null,
      lastEntries: typeof parsed.lastEntries === "number" ? parsed.lastEntries : undefined,
    };
  } catch {
    return { etag: null, lastSync: null, lastStatus: null };
  }
}

function writeState(state: SyncState) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

function validateEntries(parsed: unknown): parsed is Array<{ name: string; image: string }> {
  if (!Array.isArray(parsed)) return false;
  if (parsed.length < MIN_ENTRY_COUNT) return false;
  return parsed.every((entry) => entry !== null && typeof entry === "object" && typeof (entry as { name?: unknown }).name === "string" && typeof (entry as { image?: unknown }).image === "string");
}

async function writeAtomic(targetPath: string, body: string): Promise<void> {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.tmp`;
  fs.writeFileSync(tmpPath, body, "utf-8");
  fs.renameSync(tmpPath, targetPath);
}

export async function syncGames(force = false): Promise<SyncResult> {
  if (isSyncing) {
    return {
      status: "error",
      error: "sync already in progress",
      durationMs: 0,
      code: "BUSY",
    };
  }
  isSyncing = true;
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const prior = readState();
    const etag = force ? null : prior.etag;

    const headers: Record<string, string> = { "User-Agent": "ARMN-Sync/1.0" };
    if (etag) headers["If-None-Match"] = etag;

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(UPSTREAM_URL, { headers, signal: ac.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 304) {
      const durationMs = Date.now() - start;
      logSync(timestamp, "not-modified", `upstream=${UPSTREAM_BRANCH}`, `etag=${etag ?? "(none)"}`, `in ${durationMs}ms`);
      writeState({
        etag,
        lastSync: timestamp,
        lastStatus: "not-modified",
        lastEntries: prior.lastEntries,
      });
      return { status: "not-modified", etag: etag ?? "", durationMs };
    }

    if (!res.ok) {
      throw new Error(`upstream HTTP ${res.status}`);
    }

    const newEtag = res.headers.get("ETag") ?? "";
    const body = await res.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error("upstream JSON parse failed");
    }
    if (!validateEntries(parsed)) {
      throw new Error(`upstream JSON failed schema check (need ≥${MIN_ENTRY_COUNT} entries with string name+image)`);
    }

    await writeAtomic(LOCAL_PATH, body);
    await writeAtomic(DIST_PATH, body);

    const nextState: SyncState = {
      etag: newEtag || null,
      lastSync: timestamp,
      lastStatus: "ok",
      lastEntries: parsed.length,
    };
    writeState(nextState);

    const durationMs = Date.now() - start;
    logSync(timestamp, "ok", `upstream=${UPSTREAM_BRANCH}`, `bytes=${Buffer.byteLength(body)}`, `entries=${parsed.length}`, `etag=${newEtag || "(none)"}`, `in ${durationMs}ms`);
    return {
      status: "ok",
      bytes: Buffer.byteLength(body),
      etag: newEtag,
      durationMs,
      entries: parsed.length,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    logSync(timestamp, "error", `upstream=${UPSTREAM_BRANCH}`, `msg="${message.replace(/"/g, "'")}"`, `in ${durationMs}ms`);
    writeState({ ...readState(), lastSync: timestamp, lastStatus: "error" });
    return {
      status: "error",
      error: message,
      durationMs,
      code: err instanceof Error ? err.name : undefined,
    };
  } finally {
    isSyncing = false;
  }
}

export function getSyncStatus(): SyncState {
  return readState();
}
