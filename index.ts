import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
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
  if (!adminUser) {
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

  const PUBLIC_PATHS = ["/login", "/api/auth/login", "/sw.js", "/favicon.svg"];
  const PUBLIC_PREFIXES = ["/assets/", "/favicon", "/_astro/", "/@", "/fonts/"];

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
    return reply.code(200).send({ user: session.username, isAdmin: session.username === adminUser });
  });

  function isAdminSession(cookieHeader: string | undefined): boolean {
    const session = parseSessionCookie(cookieHeader);
    return session !== null && session.username === adminUser;
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

  async function hydrateChatMessages(): Promise<void> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, user, text, time")
      .order("time", { ascending: true })
      .limit(100);
    if (error) {
      console.error("[ARM$N] Failed to hydrate chat messages:", error.message);
      return;
    }
    chatMessages.push(...(data ?? []));
  }

  await hydrateChatMessages();

  setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [user, time] of chatRateLimits) {
      if (time < cutoff) chatRateLimits.delete(user);
    }
  }, 60_000);

  function getChatUser(req: FastifyRequest): string {
    const session = (req as FastifyRequest & { session?: Session }).session || parseSessionCookie(req.headers.cookie);
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

    const user = getChatUser(req);
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

    supabase
      .from("chat_messages")
      .insert(message)
      .then(({ error }) => {
        if (error) {
          console.error("[ARM$N] Failed to persist chat message:", error.message);
        }
      });

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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - generated by astro build
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
