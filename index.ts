import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import path from "node:path";
import zlib from "node:zlib";

EventEmitter.defaultMaxListeners = 50;

import fastifyMiddie from "@fastify/middie";
import fastifyStatic from "@fastify/static";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { build } from "astro";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import INConfig from "./config";
import { cleanupExpiredSessions, createSession, createUser, deleteSession, deleteSessionsByUser, deleteUser, getSession, getUserByUsername, listUsers, updateUser, userExists, verifyPassword } from "./src/lib/db";
import { ASSET_FOLDERS, generateMaps, getClientScript, type ObfuscationMaps, ROUTES, transformCss, transformHtml, transformJs } from "./src/lib/obfuscate";
import { NoAdminUserError, seedAdminUser } from "./src/lib/seed";
import { getSyncStatus, syncGames } from "./src/lib/sync";
import { validateDatabase } from "./src/lib/validate-db";

const UPSTREAM_BRANCH = "main";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SYNC_STARTUP_DELAY_MS = 5_000;

let obfuscationMaps: ObfuscationMaps | null = null;

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
  });

  if (INConfig.server?.compress !== false) {
    await app.register(import("@fastify/compress"), {
      encodings: ["br", "gzip", "deflate"],
    });
  }

  if (INConfig.auth?.challenge) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("\x1b[31mError: AUTH_CHALLENGE is enabled but Supabase is not configured.\x1b[0m");
      console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
      process.exit(1);
    }
    await validateDatabase().catch((err) => {
      console.error("\x1b[31m[auth] Database validation failed:\x1b[0m", err.message);
      process.exit(1);
    });
    await seedAdminUser().catch((err) => {
      if (err instanceof NoAdminUserError) {
        console.error("\x1b[31m[auth]", err.message, "\x1b[0m");
      } else {
        console.error("\x1b[31m[auth] Failed to seed admin user:\x1b[0m", err.message);
      }
      process.exit(1);
    });
  }

  interface Session {
    id: string;
    username: string;
    expiresAt: number;
  }

  const SESSION_COOKIE = "armn_session";
  const SESSION_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
  const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  function signSessionId(sessionId: string): string {
    return crypto.createHmac("sha256", SESSION_SECRET).update(sessionId).digest("base64url");
  }

  async function createSessionCookie(user: { id: number; username: string }): Promise<string> {
    const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
    const sessionId = await createSession(user, expiresAt);
    return `${sessionId}.${signSessionId(sessionId)}`;
  }

  async function destroySessionById(sessionId: string): Promise<void> {
    await deleteSession(sessionId);
  }

  async function parseSessionCookie(cookieHeader: string | undefined): Promise<Session | null> {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SESSION_COOKIE}=`)) {
        const value = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
        const [sessionId, signature] = value.split(".", 2);
        if (!sessionId || !signature) return null;
        const expected = signSessionId(sessionId);
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
        const session = await getSession(sessionId);
        if (!session || session.expires_at < Date.now()) return null;
        return { id: session.id, username: session.username, expiresAt: session.expires_at };
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

  const PUBLIC_PATHS = ["/auth", "/login", "/register", "/api/auth/login", "/api/auth/register", "/sw.js", "/favicon.svg"];
  const ADMIN_USERNAME = "armsn";
  const PUBLIC_PREFIXES = ["/assets/", "/favicon", "/_astro/", "/@"];

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

    const session = await parseSessionCookie(req.headers.cookie);
    if (session) {
      (req as FastifyRequest & { session?: Session }).session = session;

      // Restrict admin routes to the armsn user.
      if (req.url === "/admin" || req.url.startsWith("/admin/") || req.url.startsWith("/api/admin/")) {
        if (session.username !== ADMIN_USERNAME) {
          const accept = req.headers.accept || "";
          if (accept.includes("application/json") || req.url.startsWith("/api/")) {
            return reply.code(403).send({ error: "Forbidden" });
          }
          return reply.redirect("/");
        }
      }
      return;
    }

    const accept = req.headers.accept || "";
    if (accept.includes("application/json") || req.url.startsWith("/api/")) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    return reply.redirect("/auth");
  });

  const registrationAttempts = new Map<string, number[]>();
  const REGISTER_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
  const REGISTER_RATE_LIMIT_MAX = 5;

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const attempts = registrationAttempts.get(ip) ?? [];
    const recent = attempts.filter((time) => now - time < REGISTER_RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      registrationAttempts.delete(ip);
    } else {
      registrationAttempts.set(ip, recent);
    }
    return recent.length >= REGISTER_RATE_LIMIT_MAX;
  }

  function recordAttempt(ip: string): void {
    const attempts = registrationAttempts.get(ip) ?? [];
    attempts.push(Date.now());
    registrationAttempts.set(ip, attempts);
  }

  if (INConfig.auth?.challenge) {
    app.get("/login", async (_req, reply) => {
      return reply.redirect("/auth");
    });

    app.get("/register", async (_req, reply) => {
      return reply.redirect("/auth");
    });

    app.post("/api/auth/register", async (req, reply) => {
      const clientIp = req.ip ?? "unknown";
      recordAttempt(clientIp);
      if (isRateLimited(clientIp)) {
        return reply.code(429).send({ error: "Too many registration attempts. Try again later." });
      }

      const body = (req.body ?? {}) as { username?: unknown; password?: unknown; confirmPassword?: unknown };
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

      if (!username || username.length < 3 || username.length > 32) {
        return reply.code(400).send({ error: "Username must be 3-32 characters" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return reply.code(400).send({ error: "Username can only contain letters, numbers, and underscores" });
      }
      if (!password || password.length < 8) {
        return reply.code(400).send({ error: "Password must be at least 8 characters" });
      }
      if (password !== confirmPassword) {
        return reply.code(400).send({ error: "Passwords do not match" });
      }

      const exists = await userExists(username);
      if (exists) {
        return reply.code(409).send({ error: "Username already taken" });
      }

      try {
        const user = await createUser(username, password, false);
        const sessionValue = await createSessionCookie(user);
        setSessionCookie(reply, sessionValue, 7 * 24 * 60 * 60);
        return reply.code(201).send({ success: true, user: user.username });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("duplicate") || message.includes("unique")) {
          return reply.code(409).send({ error: "Username already taken" });
        }
        throw err;
      }
    });
  }

  app.post("/api/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = await getUserByUsername(username);
    if (!user) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const sessionValue = await createSessionCookie(user);
    setSessionCookie(reply, sessionValue, 7 * 24 * 60 * 60);
    return reply.code(200).send({ success: true });
  });

  app.post("/api/auth/logout", async (req, reply) => {
    const session = await parseSessionCookie(req.headers.cookie);
    if (session) {
      await destroySessionById(session.id);
    }
    clearSessionCookie(reply);
    return reply.code(200).send({ success: true });
  });

  app.get("/api/auth/session", async (req, reply) => {
    const session = await parseSessionCookie(req.headers.cookie);
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return reply.code(200).send({ user: session.username });
  });

  app.get("/api/admin/users", async (req, reply) => {
    const session = await parseSessionCookie(req.headers.cookie);
    if (!session || session.username !== ADMIN_USERNAME) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    try {
      const users = await listUsers();
      return reply.code(200).send({ users });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return reply.code(500).send({ error: message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, reply) => {
    const session = await parseSessionCookie(req.headers.cookie);
    if (!session || session.username !== ADMIN_USERNAME) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const id = Number.parseInt((req.params as { id: string }).id, 10);
    if (Number.isNaN(id)) {
      return reply.code(400).send({ error: "Invalid user ID" });
    }

    try {
      const users = await listUsers();
      const target = users.find((u) => u.id === id);
      if (!target) {
        return reply.code(404).send({ error: "User not found" });
      }
      if (target.username === ADMIN_USERNAME) {
        return reply.code(403).send({ error: "Cannot delete the admin user" });
      }

      await deleteUser(id);
      return reply.code(200).send({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return reply.code(500).send({ error: message });
    }
  });

  app.patch("/api/admin/users/:id", async (req, reply) => {
    const session = await parseSessionCookie(req.headers.cookie);
    if (!session || session.username !== ADMIN_USERNAME) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const id = Number.parseInt((req.params as { id: string }).id, 10);
    if (Number.isNaN(id)) {
      return reply.code(400).send({ error: "Invalid user ID" });
    }

    const body = (req.body ?? {}) as { password?: unknown; is_admin?: unknown };
    const updates: { password?: string; is_admin?: boolean } = {};

    if (body.password !== undefined) {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return reply.code(400).send({ error: "Password must be at least 8 characters" });
      }
      updates.password = body.password;
    }

    if (body.is_admin !== undefined) {
      updates.is_admin = body.is_admin === true || body.is_admin === "true";
    }

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: "No valid fields to update" });
    }

    try {
      const users = await listUsers();
      const target = users.find((u) => u.id === id);
      if (!target) {
        return reply.code(404).send({ error: "User not found" });
      }

      // Prevent demoting or changing the armsn user via this endpoint.
      if (target.username === ADMIN_USERNAME && updates.is_admin !== undefined) {
        return reply.code(403).send({ error: "Cannot modify the admin user's privileges" });
      }

      await updateUser(id, updates);

      // If the password was reset, invalidate all existing sessions for the
      // user so the old password/session cannot be reused.
      if (updates.password !== undefined) {
        await deleteSessionsByUser(id);
      }

      return reply.code(200).send({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return reply.code(500).send({ error: message });
    }
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

  interface ChatMessage {
    id: string;
    user: string;
    text: string;
    time: string;
  }

  const chatMessages: ChatMessage[] = [];
  const chatClients = new Set<(msg: ChatMessage) => void>();
  const chatRateLimits = new Map<string, number>();

  setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [user, time] of chatRateLimits) {
      if (time < cutoff) chatRateLimits.delete(user);
    }
  }, 60_000);

  async function getChatUser(req: FastifyRequest): Promise<string> {
    const session = (req as FastifyRequest & { session?: Session }).session || (await parseSessionCookie(req.headers.cookie));
    return session?.username || "unknown";
  }

  app.get("/api/chat/messages", async (_req, reply) => {
    return reply.code(200).send({ messages: chatMessages.slice(-100) });
  });

  app.post("/api/chat/messages", async (req, reply) => {
    const body = (req.body ?? {}) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return reply.code(400).send({ error: "Message text is required" });
    }
    if (text.length > 1000) {
      return reply.code(400).send({ error: "Message too long (max 1000 chars)" });
    }

    const user = await getChatUser(req);
    const now = Date.now();
    const lastPost = chatRateLimits.get(user) ?? 0;
    if (now - lastPost < 1000) {
      return reply.code(429).send({ error: "Rate limited. Wait a second between messages." });
    }
    chatRateLimits.set(user, now);

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      user,
      text,
      time: new Date().toISOString(),
    };

    chatMessages.push(message);
    if (chatMessages.length > 100) chatMessages.shift();

    for (const client of chatClients) {
      try {
        client(message);
      } catch {}
    }

    return reply.code(200).send(message);
  });

  app.get("/api/chat/stream", async (req, reply) => {
    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const send = (msg: ChatMessage) => {
      try {
        raw.write(`data: ${JSON.stringify(msg)}\n\n`);
      } catch {}
    };

    chatClients.add(send);

    for (const msg of chatMessages.slice(-20)) {
      send(msg);
    }

    const keepalive = setInterval(() => {
      try {
        raw.write(":keepalive\n\n");
      } catch {
        clearInterval(keepalive);
      }
    }, 30000);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearInterval(keepalive);
      chatClients.delete(send);
    };

    req.raw.on("close", cleanup);
    req.raw.on("error", cleanup);
    req.raw.on("end", cleanup);
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

  const { handler } = (await import("./dist/server/entry.mjs")) as {
    handler: (req: unknown, res: unknown, next?: () => void) => void;
  };
  await app
    .register(fastifyStatic, {
      root: path.join(import.meta.dirname, "dist", "client"),
    })
    .register(fastifyMiddie);

  if (obfuscationMaps) {
    const maps = obfuscationMaps;
    const routeScript = getClientScript(maps);

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
            content = content.replace(/<\/head>/i, `${routeScript}</head>`);
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
  setInterval(
    () => {
      void cleanupExpiredSessions().catch(() => {});
    },
    60 * 60 * 1000,
  );

  app.listen({ port }, (err, addr) => {
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
