import { c as createComponent, r as renderComponent, b as renderTemplate } from '../chunks/astro/server_ClWiFMrX.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_COdX9Zvp.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { X, Plus, Home, ChevronLeft, ChevronRight, RotateCw, Lock, Star, Maximize2 } from 'lucide-react';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:"];

const SAFE_SCHEMES = ["http:", "https:"];
function isValidHttpUrl(str) {
  if (!str) return false;
  const lowerStr = str.trim().toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lowerStr.startsWith(scheme)) return false;
  }
  try {
    const url = new URL(str);
    return SAFE_SCHEMES.includes(url.protocol);
  } catch {
    return false;
  }
}

const formatUrl = (value) => {
  if (!value.trim()) return "about:blank";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  if (!isValidHttpUrl(withProtocol)) {
    return "about:blank";
  }
  return withProtocol;
};
const classNames = (...classes) => classes.filter(Boolean).join(" ");
const iconButtonClass = "inline-flex h-8 w-8 items-center justify-center rounded text-text-secondary transition-all hover:text-accent hover:bg-white/5";
const tabButtonClass = "group relative flex h-8 max-w-[180px] items-center gap-2 rounded px-3 transition-all";
const closeButtonClass = "inline-flex h-4 w-4 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100 hover:text-accent";
const addressInputClass = "h-auto flex-1 border-0 bg-transparent p-0 text-sm text-text placeholder:text-text-placeholder focus:outline-none";
const actionBarClass = "flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 transition-all focus-within:border-accent/30";
const getDefaultUrl = () => {
  if (typeof window === "undefined") {
    return "https://duckduckgo.com";
  }
  try {
    return localStorage.getItem("engine") || "https://duckduckgo.com";
  } catch {
    return "https://duckduckgo.com";
  }
};
const encodeProxyUrl = (url) => {
  if (!url || url === "about:blank") return "about:blank";
  if (typeof window === "undefined") return url;
  const config = window.__scramjet$config;
  if (config?.codec) {
    return config.prefix + config.codec.encode(url);
  }
  return "about:blank";
};
const getActualUrl = (iframe) => {
  if (!iframe?.contentWindow) return "";
  try {
    const proxyUrl = iframe.contentWindow.location.href;
    const sjConfig = window.__scramjet$config;
    if (sjConfig && proxyUrl.includes(sjConfig.prefix)) {
      const encoded = proxyUrl.substring(proxyUrl.indexOf(sjConfig.prefix) + sjConfig.prefix.length);
      return sjConfig.codec.decode(encoded);
    }
    return proxyUrl;
  } catch {
    return "";
  }
};

const IconButton = ({ onClick, icon: Icon, className = "", disabled = false, title = "" }) => /* @__PURE__ */ jsx("button", { type: "button", onClick, disabled, title, className: classNames(iconButtonClass, "disabled:opacity-30 disabled:cursor-not-allowed", className), children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) });
function Browser() {
  const [tabs, setTabs] = useState([{ id: 1, title: "Tab 1", url: "about:blank", active: true, reloadKey: 0 }]);
  const [url, setUrl] = useState("about:blank");
  const [favicons, setFavicons] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [, setProxyReadyTick] = useState(0);
  const [proxyReady, setProxyReady] = useState(false);
  const activeTab = useMemo(() => tabs.find((tab) => tab.active), [tabs]);
  const iframeRefs = useRef({});
  const openInNewTab = useCallback((url2) => {
    const newId = Date.now();
    setTabs((prev) => [...prev.map((t) => ({ ...t, active: false })), { id: newId, title: "New Tab", url: url2, active: true, reloadKey: 0 }]);
  }, []);
  useEffect(() => {
    let firstTabUrl = getDefaultUrl();
    try {
      const goUrl = sessionStorage.getItem("goUrl");
      if (goUrl?.trim()) firstTabUrl = goUrl;
    } catch {
    }
    setTabs((prev) => prev.map((tab) => ({ ...tab, url: firstTabUrl })));
    setUrl(firstTabUrl);
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      setBookmarks(savedBookmarks);
    } catch {
    }
  }, []);
  useEffect(() => {
    const onReady = () => setProxyReadyTick((prev) => prev + 1);
    window.addEventListener("scramjet-ready", onReady);
    if (window.__scramjet$config) {
      onReady();
    }
    return () => window.removeEventListener("scramjet-ready", onReady);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const checkReady = () => {
      const sjReady = Boolean(window.__scramjet$config);
      const swReady = Boolean(navigator.serviceWorker?.controller);
      if (sjReady && swReady) setProxyReady(true);
      return sjReady && swReady;
    };
    if (checkReady()) return;
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (checkReady()) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    const actualUrl = getActualUrl(iframe);
    const nextUrl = actualUrl && actualUrl !== "about:blank" ? actualUrl : activeTab.url;
    setUrl(nextUrl);
  }, [activeTab]);
  useEffect(() => {
    if (!activeTab) return;
    if (url === "about:blank" && activeTab.url !== "about:blank") {
      setUrl(activeTab.url);
    }
  }, [activeTab, url]);
  useEffect(() => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    if (!iframe) return;
    let observer = null;
    const updateState = () => {
      const actualUrl = getActualUrl(iframe);
      if (actualUrl && actualUrl !== "about:blank" && actualUrl !== url) setUrl(actualUrl);
      try {
        const iframeTitle = iframe.contentWindow?.document?.title;
        if (iframeTitle && iframeTitle !== activeTab.title) {
          setTabs((prev) => prev.map((tab) => tab.id === activeTab.id ? { ...tab, title: iframeTitle } : tab));
        }
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          const faviconLink = iframeDoc.querySelector('link[rel="icon"]') || iframeDoc.querySelector('link[rel="shortcut icon"]') || iframeDoc.querySelector('link[rel="apple-touch-icon"]');
          if (faviconLink?.href) {
            setFavicons((prev) => ({ ...prev, [activeTab.id]: faviconLink.href }));
          } else if (actualUrl) {
            try {
              const urlObj = new URL(actualUrl);
              setFavicons((prev) => ({ ...prev, [activeTab.id]: `${urlObj.origin}/favicon.ico` }));
            } catch (_e) {
            }
          }
        }
      } catch (_e) {
      }
    };
    const setupObserver = () => {
      try {
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;
        observer?.disconnect();
        observer = new MutationObserver(() => {
          updateState();
        });
        if (iframeDoc.head) {
          observer.observe(iframeDoc.head, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["href"]
          });
        }
        const titleEl = iframeDoc.querySelector("title");
        if (titleEl) {
          observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
        }
      } catch (_e) {
      }
    };
    const handleLoad = () => {
      updateState();
      setupObserver();
    };
    iframe.addEventListener("load", handleLoad);
    updateState();
    setupObserver();
    return () => {
      iframe.removeEventListener("load", handleLoad);
      observer?.disconnect();
    };
  }, [activeTab, url]);
  useEffect(() => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    if (!iframe) return;
    const abortController = new AbortController();
    const { signal } = abortController;
    const setupIntercept = () => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow || iframeWindow.__tabInterceptSetup) return;
        iframeWindow.__tabInterceptSetup = true;
        const originalOpen = iframeWindow.open;
        iframeWindow.__originalOpen = originalOpen;
        iframeWindow.open = (url2, target, features) => {
          if (!target || target === "_blank" || target === "_new") {
            try {
              const urlStr = url2?.toString() || "";
              const fullUrl = urlStr ? new URL(urlStr, iframeWindow.location.href).href : "about:blank";
              openInNewTab(fullUrl);
              return null;
            } catch {
            }
          }
          return originalOpen.call(iframeWindow, url2, target, features);
        };
        const handleClick = (e) => {
          const target = e.target;
          const anchor = target.closest("a");
          if (anchor) {
            const linkTarget = anchor.getAttribute("target");
            const hasModifier = e.ctrlKey || e.metaKey;
            if (linkTarget === "_blank" || linkTarget === "_new" || hasModifier) {
              e.preventDefault();
              e.stopPropagation();
              const href = anchor.getAttribute("href");
              if (href) {
                try {
                  const fullUrl = new URL(href, iframeWindow.location.href).href;
                  openInNewTab(fullUrl);
                } catch {
                }
              }
            }
          }
        };
        const handleAuxClick = (e) => {
          if (e.button !== 1) return;
          const target = e.target;
          const anchor = target.closest("a");
          if (anchor) {
            e.preventDefault();
            e.stopPropagation();
            const href = anchor.getAttribute("href");
            if (href) {
              try {
                const fullUrl = new URL(href, iframeWindow.location.href).href;
                openInNewTab(fullUrl);
              } catch {
              }
            }
          }
        };
        iframeWindow.addEventListener("click", handleClick, { capture: true, signal });
        iframeWindow.addEventListener("auxclick", handleAuxClick, { capture: true, signal });
      } catch (_err) {
      }
    };
    const handleLoad = () => {
      setupIntercept();
    };
    iframe.addEventListener("load", handleLoad, { signal });
    setupIntercept();
    return () => {
      abortController.abort();
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow?.__originalOpen) {
          iframeWindow.open = iframeWindow.__originalOpen;
          iframeWindow.__tabInterceptSetup = false;
        }
      } catch (_e) {
      }
    };
  }, [activeTab, openInNewTab]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "n")) {
        e.preventDefault();
      }
    };
    const handleAuxClick = (e) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("auxclick", handleAuxClick);
    const originalWindowOpen = window.open;
    window.open = () => {
      return null;
    };
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("auxclick", handleAuxClick);
      window.open = originalWindowOpen;
    };
  }, []);
  const setActiveTab = (id) => {
    setTabs((prev) => prev.map((tab) => ({ ...tab, active: tab.id === id })));
  };
  const addNewTab = () => {
    const newId = tabs.length ? Math.max(...tabs.map((tab) => tab.id)) + 1 : 1;
    const defaultUrl = getDefaultUrl();
    setTabs((prev) => [...prev.map((tab) => ({ ...tab, active: false })), { id: newId, title: `Tab ${newId}`, url: defaultUrl, active: true, reloadKey: 0 }]);
    setUrl(defaultUrl);
  };
  const closeTab = (id) => {
    setTabs((prev) => {
      const remaining = prev.filter((tab) => tab.id !== id);
      if (remaining.length === 0) {
        let firstTabUrl = getDefaultUrl();
        try {
          const goUrl = sessionStorage.getItem("goUrl");
          if (goUrl?.trim()) firstTabUrl = goUrl;
        } catch (error) {
          console.warn("Session storage access failed:", error);
        }
        return [{ id: Date.now(), title: "Tab 1", url: firstTabUrl, active: true, reloadKey: 0 }];
      }
      if (prev.find((tab) => tab.id === id)?.active) {
        remaining[remaining.length - 1].active = true;
        setUrl(remaining[remaining.length - 1].url);
      }
      return remaining;
    });
  };
  const handleNavigate = (value) => {
    if (!activeTab) return;
    const formattedUrl = formatUrl(value);
    setTabs((prev) => prev.map((tab) => tab.id === activeTab.id ? { ...tab, url: formattedUrl, reloadKey: tab.reloadKey + 1 } : tab));
    setUrl(formattedUrl);
  };
  const removeBookmark = (bookmarkUrl, bookmarkTitle) => {
    try {
      const updatedBookmarks = bookmarks.filter((b) => !(b.url === bookmarkUrl && b.Title === bookmarkTitle));
      setBookmarks(updatedBookmarks);
      localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
    } catch {
    }
  };
  const handleAction = (action) => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    if (action === "home") {
      window.location.href = "/";
      return;
    }
    if (!iframe?.contentWindow) return;
    if (action === "back") iframe.contentWindow.history.back();
    else if (action === "forward") iframe.contentWindow.history.forward();
    else if (action === "reload") iframe.contentWindow.location.reload();
  };
  const toggleFullscreen = () => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    iframe?.requestFullscreen()?.catch(() => {
    });
  };
  const addBookmark = () => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    const actualUrl = getActualUrl(iframe) || activeTab.url;
    const title = prompt("Enter a Title for this bookmark:", activeTab.title || "New Bookmark");
    if (title && typeof localStorage !== "undefined") {
      try {
        let faviconUrl = favicons[activeTab.id] || "";
        if (!faviconUrl) {
          try {
            const urlObj = new URL(actualUrl);
            faviconUrl = `${urlObj.origin}/favicon.ico`;
          } catch (_e) {
            faviconUrl = "";
          }
        }
        const newBookmark = { Title: title, url: actualUrl, favicon: faviconUrl };
        const updatedBookmarks = [...bookmarks, newBookmark];
        setBookmarks(updatedBookmarks);
        localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      } catch {
      }
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-background-secondary/50 px-2 py-1.5 border-b border-border/50", children: [
      tabs.map((tab) => /* @__PURE__ */ jsxs("div", { className: classNames(tabButtonClass, "group", tab.active ? "bg-background text-text border border-border/50" : "text-text-secondary hover:text-text hover:bg-white/5"), children: [
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setActiveTab(tab.id), className: "flex min-w-0 flex-1 items-center gap-2 text-left", "aria-label": `Activate ${tab.title}`, children: [
          favicons[tab.id] ? /* @__PURE__ */ jsx(
            "img",
            {
              src: favicons[tab.id],
              alt: "",
              className: "h-3.5 w-3.5 shrink-0 rounded-sm",
              onError: (e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }
            }
          ) : null,
          /* @__PURE__ */ jsx("div", { className: classNames("h-3.5 w-3.5 shrink-0 rounded-sm bg-accent/20", favicons[tab.id] ? "hidden" : "") }),
          /* @__PURE__ */ jsx("span", { className: "truncate text-xs", children: tab.title })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: closeButtonClass,
            onClick: (e) => {
              e.stopPropagation();
              closeTab(tab.id);
            },
            "aria-label": `Close ${tab.title}`,
            children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
          }
        )
      ] }, tab.id)),
      /* @__PURE__ */ jsx("button", { type: "button", className: "inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:text-accent hover:bg-white/5 transition-all", onClick: addNewTab, "aria-label": "Add tab", children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-background px-2 py-1.5 border-b border-border/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(IconButton, { icon: Home, onClick: () => handleAction("home"), title: "Home" }),
        /* @__PURE__ */ jsx(IconButton, { icon: ChevronLeft, onClick: () => handleAction("back"), title: "Back" }),
        /* @__PURE__ */ jsx(IconButton, { icon: ChevronRight, onClick: () => handleAction("forward"), title: "Forward" }),
        /* @__PURE__ */ jsx(IconButton, { icon: RotateCw, onClick: () => handleAction("reload"), title: "Reload" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: actionBarClass, children: [
        /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5 text-text-placeholder" }),
        /* @__PURE__ */ jsx("input", { className: addressInputClass, value: url, placeholder: "Search or enter address", onChange: (e) => setUrl(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleNavigate(e.currentTarget.value) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(IconButton, { icon: Star, onClick: addBookmark, title: "Bookmark" }),
        /* @__PURE__ */ jsx(IconButton, { icon: Maximize2, onClick: toggleFullscreen, title: "Fullscreen" })
      ] })
    ] }),
    bookmarks.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-background px-2 py-1 overflow-x-auto border-b border-border/30", children: bookmarks.map((bookmark) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary hover:text-text hover:bg-white/5 transition-all shrink-0",
        style: { maxWidth: "160px" },
        onClick: () => handleNavigate(bookmark.url),
        onContextMenu: (e) => {
          e.preventDefault();
          if (confirm(`Remove bookmark "${bookmark.Title}"?`)) removeBookmark(bookmark.url, bookmark.Title);
        },
        children: [
          bookmark.favicon ? /* @__PURE__ */ jsx(
            "img",
            {
              src: bookmark.favicon,
              alt: "",
              className: "h-3.5 w-3.5 shrink-0",
              onError: (e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }
            }
          ) : null,
          /* @__PURE__ */ jsx(Star, { className: classNames("h-3.5 w-3.5 shrink-0", bookmark.favicon ? "hidden" : "") }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: bookmark.Title })
        ]
      },
      `${bookmark.url}-${bookmark.Title}`
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex-1 bg-background", children: [
      !proxyReady && activeTab?.url !== "about:blank" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-text-secondary", children: [
        /* @__PURE__ */ jsx("span", { className: "h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent", style: { animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" } }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Loading proxy…" })
      ] }) }),
      tabs.map((tab) => /* @__PURE__ */ jsx(
        "iframe",
        {
          ref: (el) => {
            iframeRefs.current[tab.id] = el;
          },
          title: tab.title,
          src: proxyReady ? encodeProxyUrl(tab.url) : "about:blank",
          className: classNames("absolute inset-0 h-full w-full border-0", tab.active ? "block" : "hidden"),
          sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        },
        `${tab.id}-${tab.reloadKey}`
      ))
    ] })
  ] });
}

const $$Tabs = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Browser", Browser, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/arman/Documents/GitHub/armsn/src/components/Browser.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/tabs.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/tabs.astro";
const $$url = "/tabs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tabs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
