import { c as createComponent, r as renderComponent, d as renderScript, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B5uWz4y8.mjs';
import 'piccolore';
import { jsxs, jsx } from 'react/jsx-runtime';
import { Clock, Wifi, WifiOff, Search, Globe, Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { a as getRoute } from '../chunks/Layout_LoqxeHD5.mjs';
import { a as $$Main } from '../chunks/Main_CQyHQ8wO.mjs';
export { renderers } from '../renderers.mjs';

const STORAGE_KEY = "armn-home-favorites";
const DEFAULT_FAVORITES = [
  { id: "google", name: "Google", url: "https://google.com", icon: "https://www.google.com/favicon.ico" },
  { id: "youtube", name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/favicon.ico" },
  { id: "reddit", name: "Reddit", url: "https://reddit.com", icon: "https://www.reddit.com/favicon.ico" },
  { id: "github", name: "GitHub", url: "https://github.com", icon: "https://github.com/favicon.ico" }
];
function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
  }
  return DEFAULT_FAVORITES;
}
function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
  }
}
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function isValidUrl(value) {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return true;
  return value.includes(".") && !value.includes(" ");
}
function normalizeUrl(value) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}
function getFavicon(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}
function handleFaviconError(e) {
  e.currentTarget.src = "/favicon.svg";
}
function HomeDashboard() {
  const [time, setTime] = useState(/* @__PURE__ */ new Date());
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [proxyReady, setProxyReady] = useState(false);
  const inputRef = useRef(null);
  const initializedRef = useRef(false);
  useEffect(() => {
    const loaded = loadFavorites();
    setFavorites(loaded);
    initializedRef.current = true;
  }, []);
  useEffect(() => {
    if (!initializedRef.current) return;
    saveFavorites(favorites);
  }, [favorites]);
  useEffect(() => {
    const timer = setInterval(() => setTime(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const checkProxy = () => {
      const hasScramjet = Boolean(window.__scramjet$config);
      const swReady = Boolean(navigator.serviceWorker?.controller);
      setProxyReady(hasScramjet && swReady);
    };
    checkProxy();
    const id = setInterval(checkProxy, 2e3);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);
  const handleOpen = useCallback((url) => {
    sessionStorage.setItem("goUrl", url);
    location.replace(getRoute("tabs"));
  }, []);
  const handleAdd = useCallback(() => {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !isValidUrl(url)) return;
    const normalized = normalizeUrl(url);
    const favorite = {
      id: generateId(),
      name,
      url: normalized,
      icon: getFavicon(normalized)
    };
    setFavorites((prev) => [favorite, ...prev]);
    setNewName("");
    setNewUrl("");
    setIsAdding(false);
  }, [newName, newUrl]);
  const handleRemove = useCallback((id) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewName("");
      setNewUrl("");
    }
  };
  const formatTime = (date) => date.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (date) => date.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" });
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-3xl mt-10 animate-fade-in", style: { animationDelay: "0.2s" }, children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-white/[0.05]", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-text-secondary", children: "Local Time" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 font-display text-4xl font-black tracking-tight text-text tabular-nums", children: formatTime(time) }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-text-secondary", children: formatDate(time) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all ${proxyReady ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          proxyReady ? /* @__PURE__ */ jsx(Wifi, { className: "h-5 w-5 text-emerald-400" }) : /* @__PURE__ */ jsx(WifiOff, { className: "h-5 w-5 text-amber-400" }),
          /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold uppercase tracking-wider ${proxyReady ? "text-emerald-400" : "text-amber-400"}`, children: "Proxy" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `mt-2 font-display text-lg font-bold ${proxyReady ? "text-emerald-400" : "text-amber-400"}`, children: proxyReady ? "Ready" : "Connecting" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-text-secondary", children: proxyReady ? "Scramjet + SW active" : "Waiting for service worker" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-accent transition-colors", strokeWidth: 2 }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "search",
            className: "w-full h-14 pl-12 pr-5 rounded-xl bg-white/[0.03] border border-white/10 text-base text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] focus:shadow-glow transition-all",
            placeholder: "Search or enter URL",
            type: "search",
            autoComplete: "off",
            spellCheck: "false"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-3 text-center text-xs text-text-muted", children: [
        "Press ",
        /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded bg-white/10 text-text-secondary font-mono text-[10px]", children: "Enter" }),
        " to browse"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/15", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Globe, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-text-secondary", children: "Quick Access" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsAdding((prev) => !prev), className: "flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-white/10 hover:text-text", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsx("span", { children: "Add" })
        ] })
      ] }),
      isAdding && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3 animate-fade-in", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            id: "favorite-name",
            name: "favorite-name",
            type: "text",
            value: newName,
            onChange: (e) => setNewName(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: "Site name",
            "aria-label": "Site name",
            className: "h-9 rounded-lg bg-white/5 px-3 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-accent/50"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "favorite-url",
            name: "favorite-url",
            type: "text",
            value: newUrl,
            onChange: (e) => setNewUrl(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: "URL (e.g. google.com)",
            "aria-label": "Site URL",
            className: "h-9 rounded-lg bg-white/5 px-3 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-accent/50"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setIsAdding(false);
                setNewName("");
                setNewUrl("");
              },
              className: "rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: handleAdd, disabled: !newName.trim() || !isValidUrl(newUrl.trim()), className: "rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed", children: "Save" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3", children: favorites.map((favorite) => /* @__PURE__ */ jsxs("div", { className: "group relative flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:-translate-y-1 hover:border-accent/30 hover:bg-white/[0.08] hover:shadow-glow", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleOpen(favorite.url), className: "flex w-full flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/5", children: /* @__PURE__ */ jsx("img", { src: favorite.icon, alt: "", className: "h-full w-full object-contain p-1", onError: handleFaviconError }) }),
          /* @__PURE__ */ jsx("span", { className: "w-full truncate text-center text-xs font-medium text-text", children: favorite.name })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleRemove(favorite.id), className: "absolute right-1.5 top-1.5 rounded-full p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white/10 hover:text-rose-400", "aria-label": `Remove ${favorite.name}`, children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
      ] }, favorite.id)) })
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex-1 flex flex-col items-center justify-center px-4 relative"> <div class="absolute inset-0 overflow-hidden pointer-events-none"> <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div> </div> <div class="relative text-center"> <h1 class="text-6xl md:text-8xl font-black tracking-tighter mb-2 uppercase font-display"> <span class="text-text">ARM</span><span class="text-[#26de81] text-glow animate-dollar-shimmer">$</span><span class="text-text">N</span> </h1> </div> <p id="tagline" class="relative min-h-[1.75rem] mb-8 text-base md:text-lg text-text-secondary/90 tracking-wide leading-6 opacity-0 transition-opacity duration-500"></p> ${renderComponent($$result2, "HomeDashboard", HomeDashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/HomeDashboard.tsx", "client:component-export": "default" })} </div> ` })} ${renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/index.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
