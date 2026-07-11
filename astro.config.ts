import { execFileSync } from "node:child_process";
import path from "node:path";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import compress from "@playform/compress";
import { defineConfig } from "astro/config";
import { viteStaticCopy } from "vite-plugin-static-copy";
import INConfig from "./config";

const integrations = [react(), tailwind({ applyBaseStyles: false })];

const isBuild = process.argv.includes("build");

if (isBuild && INConfig.server?.compress !== false) {
  integrations.push(
    compress({
      CSS: false,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: true,
      Logger: 0,
    }),
  );
}

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations,
  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: false,
  },
  image: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.google.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "**.gg" },
    ],
  },
  vite: {
    logLevel: "warn",
    define: {
      __COMMIT_DATE__: JSON.stringify(
        (() => {
          try {
            return execFileSync("git", ["show", "--no-patch", "--format=%ci"])
              .toString()
              .trim()
              .replace(/[<>"'&]/g, "");
          } catch {
            return new Date().toISOString();
          }
        })(),
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    plugins: [
      {
        name: "vite-wisp-server",
        configureServer(server: any) {
          server.httpServer?.on("upgrade", (req: any, socket: any, head: any) => (req.url?.startsWith("/f") ? wisp.routeRequest(req, socket, head) : undefined));
        },
      },
      viteStaticCopy({
        targets: [
          {
            src: `${epoxyPath}/**/*.mjs`.replace(/\\/g, "/"),
            dest: "assets/bundled",
            overwrite: false,
            rename: (name: string) => `ex-${name}.mjs`,
          },
          {
            src: `${baremuxPath}/**/*.js`.replace(/\\/g, "/"),
            dest: "assets/bundled",
            overwrite: false,
            rename: (name: string) => `bm-${name}.js`,
          },
        ],
      }),
    ] as any,
  },
});
