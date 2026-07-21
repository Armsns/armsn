import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const scrypt = (password: string, salt: string, keylen: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const computed = (await scrypt(password, salt, 64)).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

EventEmitter.defaultMaxListeners = 50;

import fastifyMiddie from "@fastify/middie";
import fastifyStatic from "@fastify/static";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { build } from "astro";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import INConfig from "./config.js";
import { supabase } from "./src/lib/supabase";
import { ASSET_FOLDERS, generateMaps, getClientScript, type ObfuscationMaps, ROUTES, transformCss, transformHtml, transformJs } from "./src/lib/obfuscate";
import { getSyncStatus, syncGames } from "./src/lib/sync";
import { getTextCanvasClientScript, transformTextInHtml } from "./src/lib/text-canvas";

const UPSTREAM_BRANCH = "main";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SYNC_STARTUP_DELAY_MS = 5_000;

let obfuscationMaps: ObfuscationMaps | null = null;

interface CpuTimes {
  user: number;
  nice: number;
  sys: number;
  idle: number;
  irq: number;
}

interface CpuSample {
  timestamp: number;
  times: CpuTimes[];
}

let previousCpuSample: CpuSample | null = null;

function getCpuTimes(): CpuTimes[] {
  return os.cpus().map((cpu) => ({
    user: cpu.times.user,
    nice: cpu.times.nice,
    sys: cpu.times.sys,
    idle: cpu.times.idle,
    irq: cpu.times.irq,
  }));
}

function calculateCpuUsage(current: CpuTimes[], previous: CpuTimes[]): number {
  if (current.length !== previous.length) return 0;

  let totalDiff = 0;
  let idleDiff = 0;

  for (let i = 0; i < current.length; i++) {
    const curr = current[i];
    const prev = previous[i];
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;
    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    totalDiff += currTotal - prevTotal;
    idleDiff += curr.idle - prev.idle;
  }

  if (totalDiff <= 0) return 0;
  const usage = 100 * (1 - idleDiff / totalDiff);
  return Math.max(0, Math.min(100, usage));
}

async function Start() {
  const FirstRun = process.env.FIRST === "true";

  if (!fs.existsSync("dist")) {
    console.log("ARM$N is not built yet! Building now...");

    await build({}).catch((err) => {
      console.error("Build failed:", err);
      process.exit(1);
    });

    if (FirstRun) {
      console.log("Restarting Server...");
      const disable = spawn("pnpm", ["disable"], { stdio: "inherit" });
      disable.on("close", (code) => {
        if (code === 0) {
          const start = spawn("pnpm", ["start"], { stdio: "inherit" });
          start.on("close", () => process.exit(0));
        } else {
          process.exit(code ?? 1);
        }
      });
      return;
    }
  }

  if (INConfig.server?.obfuscate !== false) {
    obfuscationMaps = generateMaps();
  }

  const port = INConfig.server?.port || 8080;

  const app = Fastify({
    serverFactory: (handler) => createServer(handler).on("upgrade", (req, socket: Socket, head) => (req.url?.startsWith("/f") ? wisp.routeRequest(req, socket, head) : socket.destroy())),
    trustProxy: process.env.TRUST_PROXY === "true",
  });

  if (INConfig.server?.compress !== false) {
    await app.register(import("@fastify/compress"), {
      encodings: ["br", "gzip", "deflate"],
    });
  }

  if (INConfig.auth?.challenge) {
    if (Object.keys(INConfig.auth.users || {}).length === 0) {
      console.error("\x1b[31mError: AUTH_CHALLENGE is enabled but no users configured.\x1b[0m");
      console.error("Set AUTH_USER and AUTH_PASS environment variables, or AUTH_USERS as JSON.");
      console.error("Example: AUTH_USER=admin AUTH_PASS=secretpassword");
      console.error('Example: AUTH_USERS=\'{"admin":"password123"}\'');
      process.exit(1);
    }
  }

  interface Session {
    id: string;
    username: string;
    expiresAt: number;
  }

  const sessions = new Map<string, Session>();
  const SESSION_COOKIE = "armn_session";
  const SESSION_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
  const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  async function hydrateSessions(): Promise<void> {
    const { data, error } = await supabase.from("sessions").select("id, username, expires_at");
    if (error) {
      console.error("[ARM$N] Failed to hydrate sessions:", error.message);
      return;
    }
    const now = Date.now();
    for (const row of data ?? []) {
      if (row.expires_at < now) continue;
      sessions.set(row.id, { id: row.id, username: row.username, expiresAt: row.expires_at });
    }
  }

  await hydrateSessions();

  async function getDynamicUser(username: string): Promise<string | null> {
    const { data } = await supabase.from("users").select("password_hash").eq("username", username).maybeSingle();
    return data?.password_hash ?? null;
  }

  const adminUser = process.env.ADMIN_USER || process.env.AUTH_USER || "";
  const adminUsers = new Set<string>(
    [adminUser, ...(process.env.AUTH_ADMINS?.split(",").map((u) => u.trim()).filter(Boolean) ?? [])].filter(Boolean),
  );
  if (adminUsers.size === 0) {
    console.warn("[ARM$N] ADMIN_USER or AUTH_USER is not set. The admin panel will be inaccessible.");
  }

  function signSessionId(sessionId: string): string {
    return crypto.createHmac("sha256", SESSION_SECRET).update(sessionId).digest("base64url");
  }

  async function createSession(username: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
    sessions.set(sessionId, { id: sessionId, username, expiresAt });
    await supabase.from("sessions").insert({ id: sessionId, username, expires_at: expiresAt });
    return `${sessionId}.${signSessionId(sessionId)}`;
  }

  async function destroySession(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
  }

  async function cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (session.expiresAt < now) {
        sessions.delete(id);
      }
    }
    const { error } = await supabase.from("sessions").delete().lt("expires_at", now);
    if (error) {
      console.error("[ARM$N] Failed to cleanup expired sessions:", error.message);
    }
  }

  setInterval(() => {
    void cleanupExpiredSessions();
  }, 60 * 60 * 1000);

  function parseSessionCookie(cookieHeader: string | undefined): Session | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SESSION_COOKIE}=`)) {
        const value = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
        const [sessionId, signature] = value.split(".", 2);
        if (!sessionId || !signature) return null;
        const expected = signSessionId(sessionId);
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
        const session = sessions.get(sessionId);
        if (!session || session.expiresAt < Date.now()) return null;
        return session;
      }
    }
    return null;
  }

  function setSessionCookie(reply: FastifyReply, value: string, maxAgeSeconds: number): void {
    reply.header("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`);
  }

  function clearSessionCookie(reply: FastifyReply): void {
    reply.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  }

  const PUBLIC_PATHS = ["/login", "/api/auth/login", "/sw.js", "/favicon.svg", "/health"];
  const PUBLIC_PREFIXES = ["/assets/", "/favicon", "/_astro/", "/@", "/fonts/", "/f/", "/f"];

  function isPublicPath(url: string): boolean {
    for (const publicPath of PUBLIC_PATHS) {
      if (url === publicPath || url.startsWith(`${publicPath}?`)) return true;
    }
    for (const prefix of PUBLIC_PREFIXES) {
      if (url.startsWith(prefix)) return true;
    }
    return false;
  }

  app.addHook("onRequest", async (req, reply) => {
    if (!INConfig.auth?.challenge) return;
    if (isPublicPath(req.url)) return;

    const session = parseSessionCookie(req.headers.cookie);
    if (session) {
      (req as FastifyRequest & { session?: Session }).session = session;
      return;
    }

    const accept = req.headers.accept || "";
    if (accept.includes("application/json") || req.url.startsWith("/api/")) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    return reply.redirect("/login");
  });

  // Track general server requests (HTML pages only, skip static assets, API calls, and proxy routes).
  app.addHook("onRequest", async (req, reply) => {
    const url = req.url;
    const isStatic = PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));
    const isApi = url.startsWith("/api/");
    const isProxy = url.startsWith(`/${scramjetRoute}/`);
    if (isStatic || isApi || isProxy) return;

    const session = parseSessionCookie(req.headers.cookie);
    trackAnalytics({
      event_type: "server_request",
      path: url.split("?")[0],
      user_agent: req.headers["user-agent"],
      ip: req.ip,
      username: session?.username,
      metadata: { method: req.method },
    });
  });

  app.post("/api/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const users = INConfig.auth?.users || {};
    const envUserPass = users[username];
    const storedPass = envUserPass ?? (await getDynamicUser(username));

    if (!storedPass) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    if (envUserPass) {
      const inputBuf = Buffer.from(password);
      const storedBuf = Buffer.from(envUserPass);
      if (inputBuf.length !== storedBuf.length || !crypto.timingSafeEqual(inputBuf, storedBuf)) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }
    } else if (!(await verifyPassword(password, storedPass))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const sessionValue = await createSession(username);
    setSessionCookie(reply, sessionValue, 7 * 24 * 60 * 60);
    trackAnalytics({
      event_type: "login",
      user_agent: req.headers["user-agent"],
      ip: req.ip,
      username,
      metadata: { source: envUserPass ? "env" : "dynamic" },
    });
    return reply.code(200).send({ success: true });
  });

  app.post("/api/auth/logout", async (req, reply) => {
    const session = parseSessionCookie(req.headers.cookie);
    if (session) {
      await destroySession(session.id);
    }
    clearSessionCookie(reply);
    return reply.code(200).send({ success: true });
  });

  app.get("/api/auth/session", async (req, reply) => {
    const session = parseSessionCookie(req.headers.cookie);
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return reply.code(200).send({ user: session.username, isAdmin: adminUsers.has(session.username) });
  });

  function isAdminSession(cookieHeader: string | undefined): boolean {
    const session = parseSessionCookie(cookieHeader);
    return session !== null && adminUsers.has(session.username);
  }

  app.get("/api/admin/users", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { data, error } = await supabase.from("users").select("username");
    if (error) {
      console.error("[ARM$N] Failed to list users:", error.message);
      return reply.code(500).send({ error: "Failed to list users" });
    }
    return reply.code(200).send({ users: (data ?? []).map((u) => u.username) });
  });

  app.post("/api/admin/users", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return reply.code(400).send({ error: "Username and password are required" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: "Password must be at least 6 characters" });
    }
    if (username === adminUser) {
      return reply.code(409).send({ error: "Cannot create a user with the admin username" });
    }

    const existing = await getDynamicUser(username);
    if (existing) {
      return reply.code(409).send({ error: "User already exists" });
    }

    const password_hash = await hashPassword(password);
    const { error } = await supabase.from("users").insert({ username, password_hash });
    if (error) {
      console.error("[ARM$N] Failed to create user:", error.message);
      return reply.code(500).send({ error: "Failed to create user" });
    }
    return reply.code(200).send({ success: true, username });
  });

  app.delete("/api/admin/users/:username", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { username } = req.params as { username: string };
    if (username === adminUser) {
      return reply.code(400).send({ error: "Cannot delete the admin account" });
    }
    const { error } = await supabase.from("users").delete().eq("username", username);
    if (error) {
      console.error("[ARM$N] Failed to delete user:", error.message);
      return reply.code(500).send({ error: "Failed to delete user" });
    }
    return reply.code(200).send({ success: true });
  });

  app.patch("/api/admin/users/:username/password", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { username } = req.params as { username: string };
    const body = (req.body ?? {}) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) {
      return reply.code(400).send({ error: "Password is required" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: "Password must be at least 6 characters" });
    }
    if (username === adminUser) {
      return reply.code(400).send({ error: "Cannot reset the admin account password from here" });
    }
    const existing = await getDynamicUser(username);
    if (!existing) {
      return reply.code(404).send({ error: "User not found" });
    }
    const password_hash = await hashPassword(password);
    const { error } = await supabase.from("users").update({ password_hash }).eq("username", username);
    if (error) {
      console.error("[ARM$N] Failed to update password:", error.message);
      return reply.code(500).send({ error: "Failed to update password" });
    }
    return reply.code(200).send({ success: true, username });
  });

  app.get("/api/admin/users/:username/proxy-history", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { username } = req.params as { username: string };
    const { data, error } = await supabase
      .from("analytics")
      .select("id, event_type, path, username, metadata, created_at")
      .eq("event_type", "proxy_usage")
      .eq("username", username)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[ARM$N] Failed to fetch proxy history:", error.message);
      return reply.code(500).send({ error: "Failed to fetch proxy history" });
    }
    const history = (data ?? []).map((event) => {
      const metadata = (event.metadata as { target?: string } | null) ?? {};
      let target = metadata.target ?? "";
      try {
        target = decodeURIComponent(target);
      } catch {
        // keep original target if decoding fails
      }
      return {
        id: event.id,
        target,
        created_at: event.created_at,
      };
    });
    return reply.code(200).send({ history });
  });

  // Analytics helpers
  const ANALYTICS_IP_SALT =
    process.env.ANALYTICS_IP_SALT ||
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_KEY ||
    "armn-analytics-salt";

  if (!process.env.ANALYTICS_IP_SALT && !process.env.AUTH_SECRET) {
    console.warn(
      "[ARM$N] ANALYTICS_IP_SALT is not set. Visitor hashing is falling back to a derived/default value. Set ANALYTICS_IP_SALT (or AUTH_SECRET) for stable visitor counts across restarts.",
    );
  }

  function hashIp(ip: string): string {
    return crypto.createHmac("sha256", ANALYTICS_IP_SALT).update(ip).digest("hex");
  }

  function trackAnalytics(event: {
    event_type: string;
    path?: string;
    user_agent?: string;
    ip?: string;
    username?: string;
    metadata?: Record<string, unknown>;
  }): void {
    const ip_hash = event.ip ? hashIp(event.ip) : undefined;
    void supabase.from("analytics").insert({
      event_type: event.event_type,
      path: event.path,
      user_agent: event.user_agent,
      ip_hash,
      username: event.username,
      metadata: event.metadata ?? {},
    }).then(({ error }) => {
      if (error) {
        console.error("[ARM$N] Failed to track analytics:", error.message);
      }
    });
  }

  const analyticsRateLimits = new Map<string, number>();
  const ANALYTICS_RATE_LIMIT_MS = 1000;

  // Clean up stale analytics rate-limit entries to prevent unbounded growth.
  setInterval(() => {
    const cutoff = Date.now() - ANALYTICS_RATE_LIMIT_MS * 2;
    for (const [ip, lastPost] of analyticsRateLimits) {
      if (lastPost < cutoff) {
        analyticsRateLimits.delete(ip);
      }
    }
  }, 60_000);

  app.post("/api/analytics/track", async (req, reply) => {
    const clientIp = req.ip || "unknown";
    const now = Date.now();
    const lastPost = analyticsRateLimits.get(clientIp) ?? 0;
    if (now - lastPost < ANALYTICS_RATE_LIMIT_MS) {
      return reply.code(429).send({ error: "Rate limited" });
    }
    analyticsRateLimits.set(clientIp, now);

    const body = (req.body ?? {}) as {
      event_type?: unknown;
      path?: unknown;
      metadata?: unknown;
    };
    const event_type = typeof body.event_type === "string" ? body.event_type.trim() : "";
    if (!event_type) {
      return reply.code(400).send({ error: "event_type is required" });
    }
    const path = typeof body.path === "string" ? body.path : undefined;
    const metadata = typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : {};
    const session = parseSessionCookie(req.headers.cookie);
    trackAnalytics({
      event_type,
      path,
      user_agent: req.headers["user-agent"],
      ip: req.ip,
      username: session?.username,
      metadata,
    });
    return reply.code(200).send({ success: true });
  });

  app.get("/api/admin/analytics", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const now = new Date();

    const query = req.query as { startDate?: string; endDate?: string };
    const startDate = query.startDate ? new Date(query.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDateInput = query.endDate ? new Date(query.endDate) : now;
    // Make the selected end date inclusive by using the end of that day.
    const endDate = new Date(endDateInput);
    endDate.setHours(23, 59, 59, 999);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return reply.code(400).send({ error: "Invalid date range" });
    }
    if (startDate > endDate) {
      return reply.code(400).send({ error: "startDate must be before endDate" });
    }
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      return reply.code(400).send({ error: "Date range cannot exceed 1 year" });
    }

    const [
      totalViewsResult,
      uniqueVisitorsResult,
      serverRequestsCountResult,
      loginsResult,
      proxyResult,
      serverRequestsResult,
      topPagesResult,
      viewsOverTimeResult,
      serverRequestsOverTimeResult,
    ] = await Promise.all([
      supabase
        .from("analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view"),
      supabase.rpc("get_unique_visitor_count", {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      }),
      supabase
        .from("analytics")
        .select("*")
        .eq("event_type", "login")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("analytics")
        .select("*")
        .eq("event_type", "proxy_usage")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "server_request"),
      supabase
        .from("analytics")
        .select("*")
        .eq("event_type", "server_request")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.rpc("get_top_pages", {
        page_limit: 10,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      }),
      supabase.rpc("get_daily_event_counts", {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        event_type_filter: "page_view",
      }),
      supabase.rpc("get_daily_event_counts", {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        event_type_filter: "server_request",
      }),
    ]);

    const errors = [
      totalViewsResult.error,
      uniqueVisitorsResult.error,

      loginsResult.error,
      proxyResult.error,
      serverRequestsCountResult.error,
      serverRequestsResult.error,
      topPagesResult.error,
      viewsOverTimeResult.error,
      serverRequestsOverTimeResult.error,
    ];
    if (errors.some(Boolean)) {
      console.error("[ARM$N] Failed to fetch analytics", errors.filter(Boolean));
      return reply.code(500).send({ error: "Failed to fetch analytics" });
    }

    const topPagesArray = (topPagesResult.data ?? []).map((row: { path: string; count: number }) => ({
      path: row.path,
      count: Number(row.count),
    }));

    return reply.code(200).send({
      totalViews: totalViewsResult.count ?? 0,
      uniqueVisitors: Number(uniqueVisitorsResult.data ?? 0),
      totalServerRequests: serverRequestsCountResult.count ?? 0,
      viewsOverTime: (viewsOverTimeResult.data ?? []).map((row: { day: string; count: number }) => ({
        day: row.day,
        count: Number(row.count),
      })),
      serverRequestsOverTime: (serverRequestsOverTimeResult.data ?? []).map((row: { day: string; count: number }) => ({
        day: row.day,
        count: Number(row.count),
      })),
      recentLogins: loginsResult.data ?? [],
      recentProxyUsage: proxyResult.data ?? [],
      recentServerRequests: serverRequestsResult.data ?? [],
      topPages: topPagesArray,
    });
  });

  app.get("/api/admin/system", async (req, reply) => {
    if (!isAdminSession(req.headers.cookie)) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const cpus = os.cpus();
    const cpuInfo = cpus.map((cpu) => ({
      model: cpu.model,
      speed: cpu.speed,
    }));

    const currentTimes = getCpuTimes();
    const now = Date.now();
    let cpuUsage = 0;
    if (previousCpuSample && now > previousCpuSample.timestamp) {
      cpuUsage = calculateCpuUsage(currentTimes, previousCpuSample.times);
    }
    previousCpuSample = { timestamp: now, times: currentTimes };

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    let disk: { total: number; free: number; used: number } | null = null;
    try {
      const stats = fs.statfsSync("/");
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      disk = {
        total,
        free,
        used: total - free,
      };
    } catch {
      disk = null;
    }

    const networkInterfaces = os.networkInterfaces();

    return reply.code(200).send({
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      cpu: {
        count: cpus.length,
        model: cpuInfo[0]?.model ?? "Unknown",
        speed: cpuInfo[0]?.speed ?? 0,
        usage: cpuUsage,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usedPercentage: totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0,
      },
      disk,
      networkInterfaces,
      timestamp: new Date().toISOString(),
    });
  });

  if (obfuscationMaps) {
    const reverseRoutes = obfuscationMaps.reverseRoutes;
    const reverseAssets = obfuscationMaps.reverseAssets;
    const literalRoutes = new Set<string>(ROUTES);
    const literalAssetFolders = new Set<string>(ASSET_FOLDERS);

    app.addHook("onRequest", (req, reply, done) => {
      if (req.headers) {
        req.headers["accept-encoding"] = "identity";
      }
      const rawHeaders = (req.raw as { headers?: Record<string, string> }).headers;
      if (rawHeaders) {
        rawHeaders["accept-encoding"] = "identity";
      }

      const [urlPath, query] = req.url.split("?");
      const pathParts = urlPath.split("/").filter(Boolean);
      let modified = false;

      if (pathParts.length > 0) {
        const firstPart = pathParts[0];

        if (literalRoutes.has(firstPart)) {
          reply.code(404).send("Not Found");
          return;
        }

        if (firstPart === "assets" && pathParts.length >= 2) {
          const assetFolder = pathParts[1];
          if (literalAssetFolders.has(assetFolder)) {
            reply.code(404).send("Not Found");
            return;
          }
        }

        const realRoute = reverseRoutes[firstPart];
        if (realRoute && realRoute !== "scramjet") {
          pathParts[0] = realRoute;
          modified = true;
        }

        if (pathParts[0] === "assets" && pathParts.length >= 2) {
          const assetFolder = pathParts[1];
          const realFolder = reverseAssets[assetFolder];
          if (realFolder && realFolder !== "scramjet") {
            pathParts[1] = realFolder;
            modified = true;
          }

          if (pathParts.length >= 3) {
            const fileName = pathParts[2];
            const lastDot = fileName.lastIndexOf(".");
            const baseName = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
            const ext = lastDot > 0 ? fileName.slice(lastDot) : "";
            const realBaseName = reverseAssets[baseName];
            if (realBaseName) {
              pathParts[2] = realBaseName + ext;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        const newUrl = `/${pathParts.join("/")}${query ? `?${query}` : ""}`;
        (req.raw as { url?: string }).url = newUrl;
        Object.defineProperty(req, "url", {
          value: newUrl,
          writable: true,
          configurable: true,
        });
      }

      done();
    });
  }

  // Always register proxy endpoints - with or without obfuscation.
  // When obfuscation is off, fall back to the canonical, un-obfuscated names.
  const assets = obfuscationMaps?.assets ?? {
    scramjet: "scramjet",
    "scramjet.all": "scramjet.all",
    "scramjet.sync": "scramjet.sync",
    "scramjet.wasm": "scramjet.wasm",
  };
  const routes = obfuscationMaps?.routes ?? {
    scramjet: "scramjet",
    tabs: "tabs",
  };
  const scramjetFolder = assets.scramjet;
  const scramjetRoute = routes.scramjet;
  const sjAll = assets["scramjet.all"];

  app.get("/health", async (_req, reply) => {
    return reply.code(200).send({ status: "ok" });
  });

  app.get("/sw.js", (_req, reply) => {
    const swCode = `importScripts("/assets/${scramjetFolder}/${sjAll}.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
const scramjetPrefix = "/${scramjetRoute}/";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      await scramjet.loadConfig();
      try {
        const url = new URL(event.request.url);
        if (!url.pathname.startsWith(scramjetPrefix)) {
          return fetch(event.request);
        }
      } catch (_e) {}
      if (scramjet.route(event)) {
        return scramjet.fetch(event);
      }
      return fetch(event.request);
    })()
  );
});
`;
    reply.header("Service-Worker-Allowed", "/").type("application/javascript").send(swCode);
  });

  app.get(`/assets/${scramjetFolder}/*`, (req, reply) => {
    const fileName = req.url.split("/").pop() || "";
    let realFileName = fileName;
    for (const [original, obfuscated] of Object.entries(assets)) {
      if (fileName.startsWith(obfuscated)) {
        const ext = fileName.slice(obfuscated.length);
        realFileName = original + ext;
        break;
      }
    }
    reply.header("Access-Control-Allow-Origin", "*");
    return reply.sendFile(`assets/scramjet/${realFileName}`, path.join(import.meta.dirname, "dist", "client"));
  });

  app.get(`/${scramjetRoute}/*`, (req, reply) => {
    const encodedPath = req.url.slice(`/${scramjetRoute}/`.length);
    const session = parseSessionCookie(req.headers.cookie);
    trackAnalytics({
      event_type: "proxy_usage",
      path: `/${scramjetRoute}/${encodedPath}`,
      user_agent: req.headers["user-agent"],
      ip: req.ip,
      username: session?.username,
      metadata: { target: encodedPath },
    });
    let targetUrl = "";
    try {
      targetUrl = decodeURIComponent(encodedPath);
    } catch {
      targetUrl = encodedPath;
    }

    const tabsRoute = routes.tabs;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Loading proxy...</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #1a1a1a;
      color: #fff;
    }
  </style>
</head>
<body>
  <div id="status">Initializing...</div>
  <script type="module">
    const status = document.getElementById('status');
    const targetUrl = ${JSON.stringify(targetUrl)};

    async function init() {
      try {
        status.textContent = 'Setting up transport...';

        const { BareMuxConnection } = await import('/assets/bundled/bm-index.mjs');
        const connection = new BareMuxConnection("/assets/bundled/bm-worker.js");
        const wispUrl = (location.protocol === "http:" ? "ws:" : "wss:") + "//" + location.host + "/f/";
        await connection.setTransport("/assets/bundled/ex-index.mjs", [{ wisp: wispUrl }]);

        status.textContent = 'Transport ready, loading page...';

        if (targetUrl && targetUrl.startsWith('http')) {
          sessionStorage.setItem('goUrl', targetUrl);
        }

        await new Promise(r => setTimeout(r, 200));
        location.replace('/${tabsRoute}');

      } catch (e) {
        status.textContent = 'Error: ' + e.message;
        console.error('Init error:', e);
      }
    }

    init();
  </script>
</body>
</html>`;

    reply.type("text/html; charset=utf-8").send(html);
  });

  app.post("/api/sync-games", async (req, reply) => {
    const authHeader = req.headers.authorization;
    const headerToken = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : undefined;
    const queryTokenRaw = (req.query as { token?: unknown }).token;
    const queryToken = typeof queryTokenRaw === "string" ? queryTokenRaw : undefined;
    const providedToken = headerToken ?? queryToken;

    const expected = process.env.SYNC_TOKEN;
    if (expected && providedToken !== expected) {
      return reply.code(401).send({ error: "Invalid or missing SYNC_TOKEN" });
    }

    const forceRaw = (req.query as { force?: unknown }).force;
    const force = forceRaw === "1" || forceRaw === "true";
    const result = await syncGames(force);
    if (result.status === "error") {
      const code = result.code === "BUSY" ? 429 : 502;
      return reply.code(code).send(result);
    }
    return reply.code(200).send(result);
  });

  app.get("/api/sync-games", async (_req, reply) => {
    return reply.code(200).send({
      ...getSyncStatus(),
      authRequired: Boolean(process.env.SYNC_TOKEN),
      intervalMs: SYNC_INTERVAL_MS,
      upstreamBranch: UPSTREAM_BRANCH,
    });
  });

  app.addHook("onSend", (_request, reply, _payload, done) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "SAMEORIGIN");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Permissions-Policy", "geolocation=(self), microphone=(self), camera=(self)");
    reply.header("X-XSS-Protection", "1; mode=block");
    const ct = reply.getHeader("content-type");
    if (ct && String(ct).toLowerCase().includes("text/html")) {
      reply.header("Pragma", "no-cache");
    }
    done();
  });

  let handler: (req: unknown, res: unknown, next?: () => void) => void;
  try {
    // @ts-ignore - generated by astro build
    ({ handler } = (await import("./dist/server/entry.mjs")) as {
      handler: (req: unknown, res: unknown, next?: () => void) => void;
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      "[ARM$N] Could not import dist/server/entry.mjs; falling back to a 404 handler.",
      "Run `npx astro build` to enable Astro SSR through this server.",
      "\n  reason:",
      reason,
    );
    // `app.use()` from `@fastify/middie` runs in `onRequest`, BEFORE Fastify's
    // native route matching. If the middleware short-circuits the response
    // (no `next()` called), every request — including explicit routes like
    // `/api/*` and `/sw.js` — gets swallowed here. So our dev fallback just
    // passes through; unmatched requests are handled by `setNotFoundHandler`
    // below with a helpful message.
    handler = (_req: unknown, _res: unknown, next?: () => void) => {
      if (next) next();
    };
    app.setNotFoundHandler((_req, reply) => {
      reply.code(404).send("Astro SSR not available — dist/server/entry.mjs is missing or broken. Run `npx astro build`.");
    });
  }
  await app
    .register(fastifyStatic, {
      root: path.join(import.meta.dirname, "dist", "client"),
    })
    .register(fastifyMiddie);

  if (obfuscationMaps) {
    const maps = obfuscationMaps;
    const routeScript = getClientScript(maps);
    const textScript = getTextCanvasClientScript(maps.textKey);

    const transformMiddleware = (_req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const originalWriteHead = res.writeHead.bind(res);
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      const originalSetHeader = res.setHeader.bind(res);
      const originalRemoveHeader = res.removeHeader.bind(res);

      let contentType: "html" | "js" | "css" | null = null;
      let statusCode = 200;
      let headers: Record<string, string | string[] | number | undefined> = {};
      const chunks: Buffer[] = [];

      const detectContentType = (ct: string): "html" | "js" | "css" | null => {
        const lower = ct.toLowerCase();
        if (lower.includes("text/html")) return "html";
        if (lower.includes("text/css")) return "css";
        if (lower.includes("application/javascript") || lower.includes("text/javascript") || lower.includes("application/x-javascript") || lower.includes("application/ecmascript")) {
          return "js";
        }
        return null;
      };

      const pushChunk = (chunks: Buffer[], chunk: unknown, encoding?: BufferEncoding): void => {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
        } else if (typeof chunk === "string") {
          chunks.push(Buffer.from(chunk, encoding || "utf8"));
        }
      };

      res.setHeader = (name: string, value: string | number | readonly string[]): ServerResponse => {
        const nameLower = name.toLowerCase();
        if (nameLower === "content-type") {
          contentType = detectContentType(String(value));
        }
        if (contentType && (nameLower === "content-encoding" || nameLower === "transfer-encoding")) {
          return res;
        }
        return originalSetHeader(name, value);
      };

      res.writeHead = (code: number, reasonOrHeaders?: any, headersArg?: any): ServerResponse => {
        statusCode = code;
        const h = typeof reasonOrHeaders === "object" ? reasonOrHeaders : headersArg || {};
        headers = { ...headers, ...h };

        const ct = (h["content-type"] || h["Content-Type"] || "").toString();
        if (ct) {
          contentType = contentType || detectContentType(ct);
        }

        if (!contentType) {
          const existingCt = res.getHeader("content-type");
          if (existingCt) {
            contentType = detectContentType(String(existingCt));
          }
        }

        if (contentType) {
          delete headers["content-encoding"];
          delete headers["Content-Encoding"];
          delete headers["transfer-encoding"];
          delete headers["Transfer-Encoding"];
          originalRemoveHeader("content-encoding");
          originalRemoveHeader("transfer-encoding");
          return res;
        }

        return originalWriteHead(code, reasonOrHeaders, headersArg);
      };

      res.write = (chunk: any, encodingOrCb?: any, cb?: any): boolean => {
        if (contentType && chunk) {
          const enc = typeof encodingOrCb === "string" ? (encodingOrCb as BufferEncoding) : undefined;
          pushChunk(chunks, chunk, enc);
          const callback = typeof encodingOrCb === "function" ? encodingOrCb : cb;
          if (typeof callback === "function") callback();
          return true;
        }
        return originalWrite(chunk, encodingOrCb, cb);
      };

      res.end = (chunk?: any, encodingOrCb?: any, cb?: any): ServerResponse => {
        if (contentType) {
          if (chunk && typeof chunk !== "function") {
            const enc = typeof encodingOrCb === "string" ? (encodingOrCb as BufferEncoding) : undefined;
            pushChunk(chunks, chunk, enc);
          }

          let body = Buffer.concat(chunks);
          const encodingHeader = (headers["content-encoding"] || headers["Content-Encoding"] || res.getHeader("content-encoding") || res.getHeader("Content-Encoding")) as string | string[] | undefined;
          const encoding = Array.isArray(encodingHeader) ? encodingHeader[0] : encodingHeader;
          if (encoding) {
            try {
              if (encoding.includes("br")) {
                body = zlib.brotliDecompressSync(body);
              } else if (encoding.includes("gzip")) {
                body = zlib.gunzipSync(body);
              } else if (encoding.includes("deflate")) {
                body = zlib.inflateSync(body);
              }
            } catch (_e) {}
          }

          let content = body.toString("utf8");

          if (contentType === "html") {
            content = transformHtml(content, maps);
            content = transformTextInHtml(content, maps.textKey);
            content = content.replace(/<\/head>/i, `${routeScript}${textScript}</head>`);
          } else if (contentType === "css") {
            content = transformCss(content, maps);
          } else if (contentType === "js") {
            content = transformJs(content, maps);
          }

          const transformedBody = Buffer.from(content, "utf8");

          headers["cache-control"] = "no-store, no-cache, must-revalidate";
          headers.pragma = "no-cache";

          headers["content-length"] = transformedBody.length;
          delete headers["transfer-encoding"];
          delete headers["content-encoding"];
          delete headers["Content-Encoding"];

          originalWriteHead(statusCode, headers);
          originalEnd(transformedBody);

          const callback = typeof chunk === "function" ? chunk : typeof encodingOrCb === "function" ? encodingOrCb : cb;
          if (typeof callback === "function") callback();

          return res;
        }

        return originalEnd(chunk, encodingOrCb, cb);
      };

      next();
    };

    app.use(transformMiddleware);
    app.use(handler);
  } else {
    app.use(handler);
  }
  const host = process.env.HOST || "0.0.0.0";
  app.listen({ port, host }, (err, addr) => {
    if (err) {
      console.error("Server failed to start:", err);
      process.exit(1);
    }
    console.log("Server listening on %s", addr);

    if (!process.env.SYNC_TOKEN) {
      console.warn("[armn-sync] SYNC_TOKEN not set — POST /api/sync-games is unauthenticated. Set SYNC_TOKEN before exposing publicly.");
    }
    setTimeout(() => {
      void syncGames().catch(() => {});
      setInterval(() => {
        void syncGames().catch(() => {});
      }, SYNC_INTERVAL_MS);
    }, SYNC_STARTUP_DELAY_MS);
  });
}

process.env.FIRST = process.env.FIRST || "true";
await Start();
