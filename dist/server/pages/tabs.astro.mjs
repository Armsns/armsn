import { c as createComponent, r as renderComponent, b as renderTemplate } from '../chunks/astro/server_qhutUUez.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_VXOGlr6V.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { X, Plus, Home, ChevronLeft, ChevronRight, RotateCw, Lock, Clock, Download, Star, Maximize2, Minus, Trash2 } from 'lucide-react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { s as showToast } from '../chunks/toast_CkU3v4gj.mjs';
export { renderers } from '../renderers.mjs';

const STORAGE_KEY$1 = "armn-downloads";
const MAX_DOWNLOADS = 50;
function loadDownloads() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY$1);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveDownloads(downloads) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY$1, JSON.stringify(downloads));
  } catch {
  }
}
function addDownload(download, prev = loadDownloads()) {
  const newDownload = {
    ...download,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now()
  };
  const updated = [newDownload, ...prev].slice(0, MAX_DOWNLOADS);
  saveDownloads(updated);
  return updated;
}
function removeDownload(id) {
  const downloads = loadDownloads();
  const updated = downloads.filter((d) => d.id !== id);
  saveDownloads(updated);
  return updated;
}
function clearDownloads() {
  saveDownloads([]);
  return [];
}
function formatFileSize(bytes) {
  if (bytes == null) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
function getFilenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/");
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  } catch {
  }
  return "download";
}

const STORAGE_KEY = "armn-history";
const MAX_ENTRIES = 50;
function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function addHistoryEntry(entry) {
  try {
    const history = getHistory();
    const newEntry = { ...entry, timestamp: Date.now() };
    const filtered = history.filter((h) => h.url !== entry.url);
    filtered.unshift(newEntry);
    if (filtered.length > MAX_ENTRIES) {
      filtered.length = MAX_ENTRIES;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
  }
}

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
const tabButtonClass = "group relative flex h-8 max-w-[180px] cursor-pointer items-center gap-2 rounded px-3 transition-all";
const closeButtonClass = "inline-flex h-4 w-4 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100 hover:text-accent";
const addressInputClass = "h-auto flex-1 border-0 bg-transparent p-0 text-sm text-text placeholder:text-text-placeholder focus:outline-none";
const actionBarClass = "flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 transition-all focus-within:border-accent/30";
const getDefaultUrl = () => {
  if (typeof window === "undefined") {
    return "https://duckduckgo.com";
  }
  try {
    return localStorage.getItem("engine") || "https://duckduckgo.com";
  } catch (error) {
    console.warn("Storage access failed:", error);
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
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
function Browser() {
  const [tabs, setTabs] = useState([{ id: 1, title: "Tab 1", url: "about:blank", active: true, reloadKey: 0, pinned: false, zoom: 1 }]);
  const [url, setUrl] = useState("about:blank");
  const [favicons, setFavicons] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const addressInputRef = useRef(null);
  const addDownloadEntry = useCallback((download) => {
    setDownloads((prev) => addDownload(download, prev));
  }, []);
  const [_proxyReadyTick, setProxyReadyTick] = useState(0);
  const [proxyReady, setProxyReady] = useState(false);
  const activeTab = useMemo(() => tabs.find((tab) => tab.active), [tabs]);
  const iframeRefs = useRef({});
  const openInNewTab = useCallback((url2) => {
    const newId = Date.now();
    setTabs((prev) => [...prev.map((t) => ({ ...t, active: false })), { id: newId, title: "New Tab", url: url2, active: true, reloadKey: 0, pinned: false, zoom: 1 }]);
  }, []);
  useEffect(() => {
    let firstTabUrl = getDefaultUrl();
    try {
      const goUrl = sessionStorage.getItem("goUrl");
      if (goUrl?.trim()) firstTabUrl = goUrl;
    } catch (error) {
      console.warn("Session storage access failed:", error);
    }
    setTabs((prev) => prev.map((tab) => ({ ...tab, url: firstTabUrl, zoom: tab.zoom ?? 1 })));
    setUrl(firstTabUrl);
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      setBookmarks(savedBookmarks);
    } catch (error) {
      console.warn("Failed to load bookmarks:", error);
    }
    setDownloads(loadDownloads());
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
            } catch (err) {
              console.warn("Failed to intercept window.open:", err);
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
            const downloadAttr = anchor.getAttribute("download");
            if (downloadAttr != null) {
              const href = anchor.getAttribute("href");
              if (href) {
                try {
                  const fullUrl = new URL(href, iframeWindow.location.href).href;
                  const filename = typeof downloadAttr === "string" && downloadAttr.trim() ? downloadAttr : getFilenameFromUrl(fullUrl);
                  addDownloadEntry({ url: fullUrl, filename, status: "pending" });
                  showToast(`Download started: ${filename}`, "info");
                } catch (err) {
                  console.warn("Failed to intercept download click:", err);
                }
              }
            }
            if (linkTarget === "_blank" || linkTarget === "_new" || hasModifier) {
              e.preventDefault();
              e.stopPropagation();
              const href = anchor.getAttribute("href");
              if (href) {
                try {
                  const fullUrl = new URL(href, iframeWindow.location.href).href;
                  openInNewTab(fullUrl);
                } catch (err) {
                  console.warn("Failed to intercept link click:", err);
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
              } catch (err) {
                console.warn("Failed to intercept middle-click:", err);
              }
            }
          }
        };
        iframeWindow.addEventListener("click", handleClick, { capture: true, signal });
        iframeWindow.addEventListener("auxclick", handleAuxClick, { capture: true, signal });
        const handleDownload = (e) => {
          try {
            const raw = e.download;
            const url2 = typeof raw?.url === "string" ? raw.url : "";
            const filename = typeof raw?.filename === "string" && raw.filename ? raw.filename : getFilenameFromUrl(url2 || iframeWindow.location.href);
            addDownloadEntry({ url: url2 || iframeWindow.location.href, filename, status: "pending" });
            showToast(`Download started: ${filename}`, "info");
          } catch (err) {
            console.warn("Failed to handle download event:", err);
          }
        };
        iframeWindow.addEventListener("download", handleDownload, { signal });
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
  }, [activeTab, openInNewTab, addDownloadEntry]);
  const setActiveTab = (id) => {
    setTabs((prev) => prev.map((tab) => ({ ...tab, active: tab.id === id })));
  };
  const addNewTab = useCallback(() => {
    const defaultUrl = getDefaultUrl();
    setTabs((prev) => {
      const newId = prev.length ? Math.max(...prev.map((tab) => tab.id)) + 1 : 1;
      return [...prev.map((tab) => ({ ...tab, active: false })), { id: newId, title: `Tab ${newId}`, url: defaultUrl, active: true, reloadKey: 0, pinned: false, zoom: 1 }];
    });
    setUrl(defaultUrl);
  }, []);
  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      const tabToClose = prev.find((tab) => tab.id === id);
      if (tabToClose?.pinned) {
        showToast("Pinned tabs cannot be closed", "error");
        return prev;
      }
      const remaining = prev.filter((tab) => tab.id !== id);
      if (remaining.length === 0) {
        let firstTabUrl = getDefaultUrl();
        try {
          const goUrl = sessionStorage.getItem("goUrl");
          if (goUrl?.trim()) firstTabUrl = goUrl;
        } catch (error) {
          console.warn("Session storage access failed:", error);
        }
        return [{ id: Date.now(), title: "Tab 1", url: firstTabUrl, active: true, reloadKey: 0, pinned: false, zoom: 1 }];
      }
      if (prev.find((tab) => tab.id === id)?.active) {
        remaining[remaining.length - 1].active = true;
        setUrl(remaining[remaining.length - 1].url);
      }
      return remaining;
    });
  }, []);
  const togglePinTab = (id, e) => {
    setTabs(
      (prev) => prev.map((tab) => {
        if (tab.id !== id) return tab;
        const pinned = !tab.pinned;
        showToast(pinned ? "Tab pinned" : "Tab unpinned", "success");
        return { ...tab, pinned };
      })
    );
  };
  const handleNavigate = (value) => {
    if (!activeTab) return;
    const formattedUrl = formatUrl(value);
    setTabs((prev) => prev.map((tab) => tab.id === activeTab.id ? { ...tab, url: formattedUrl, reloadKey: tab.reloadKey + 1 } : tab));
    setUrl(formattedUrl);
    if (formattedUrl !== "about:blank") {
      addHistoryEntry({ url: formattedUrl, title: formattedUrl });
    }
  };
  const removeBookmark = (bookmarkUrl, bookmarkTitle) => {
    try {
      const updatedBookmarks = bookmarks.filter((b) => !(b.url === bookmarkUrl && b.Title === bookmarkTitle));
      setBookmarks(updatedBookmarks);
      localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      showToast("Bookmark removed", "info");
    } catch (e) {
      console.error("Failed to remove bookmark:", e);
    }
  };
  const handleAction = useCallback(
    (action) => {
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
    },
    [activeTab]
  );
  const toggleFullscreen = () => {
    if (!activeTab) return;
    const iframe = iframeRefs.current[activeTab.id];
    iframe?.requestFullscreen().catch((err) => console.error("Failed to enter fullscreen mode:", err));
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
        showToast("Bookmark added", "success");
      } catch (e) {
        console.error("Failed to add bookmark:", e);
        showToast("Failed to add bookmark", "error");
      }
    }
  };
  const sortedTabs = useMemo(() => {
    return [...tabs].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [tabs]);
  const setZoom = useCallback((id, zoom) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(2))));
    setTabs((prev) => prev.map((tab) => tab.id === id ? { ...tab, zoom: clamped } : tab));
  }, []);
  const zoomIn = useCallback(() => {
    if (!activeTab) return;
    setZoom(activeTab.id, (activeTab.zoom ?? 1) + ZOOM_STEP);
  }, [activeTab, setZoom]);
  const zoomOut = useCallback(() => {
    if (!activeTab) return;
    setZoom(activeTab.id, (activeTab.zoom ?? 1) - ZOOM_STEP);
  }, [activeTab, setZoom]);
  const resetZoom = useCallback(() => {
    if (!activeTab) return;
    setZoom(activeTab.id, 1);
  }, [activeTab, setZoom]);
  const addNewTabRef = useRef(addNewTab);
  const closeTabRef = useRef(closeTab);
  const handleActionRef = useRef(handleAction);
  const activeTabRef = useRef(activeTab);
  const zoomInRef = useRef(zoomIn);
  const zoomOutRef = useRef(zoomOut);
  const resetZoomRef = useRef(resetZoom);
  useEffect(() => {
    addNewTabRef.current = addNewTab;
    closeTabRef.current = closeTab;
    handleActionRef.current = handleAction;
    activeTabRef.current = activeTab;
    zoomInRef.current = zoomIn;
    zoomOutRef.current = zoomOut;
    resetZoomRef.current = resetZoom;
  }, [addNewTab, closeTab, handleAction, activeTab, zoomIn, zoomOut, resetZoom]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "n")) {
        e.preventDefault();
        addNewTabRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        const currentTab = activeTabRef.current;
        if (currentTab) closeTabRef.current(currentTab.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleActionRef.current("reload");
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomInRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOutRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoomRef.current();
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
  return /* @__PURE__ */ jsxs("div", { className: "flex h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-background-secondary/50 px-2 py-1.5 border-b border-border/50", children: [
      sortedTabs.map((tab) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setActiveTab(tab.id), className: classNames(tabButtonClass, tab.active ? "bg-background text-text border border-border/50" : "text-text-secondary hover:text-text hover:bg-white/5", tab.pinned && "max-w-[80px]"), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2", children: [
          tab.pinned ? /* @__PURE__ */ jsx("span", { className: "text-accent text-xs", children: "📌" }) : favicons[tab.id] ? /* @__PURE__ */ jsx(
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
          /* @__PURE__ */ jsx("span", { className: "truncate text-xs", children: tab.pinned ? "" : tab.title })
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
            onContextMenu: (e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePinTab(tab.id);
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
        /* @__PURE__ */ jsx("input", { ref: addressInputRef, className: addressInputClass, value: url, placeholder: "Search or enter address", onChange: (e) => setUrl(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleNavigate(e.currentTarget.value) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(
          IconButton,
          {
            icon: Clock,
            onClick: () => {
              setShowDownloads(false);
              setShowHistory((prev) => !prev);
            },
            title: "History",
            className: showHistory ? "text-accent" : ""
          }
        ),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            icon: Download,
            onClick: () => {
              setShowHistory(false);
              setShowDownloads((prev) => !prev);
            },
            title: "Downloads",
            className: showDownloads ? "text-accent" : ""
          }
        ),
        /* @__PURE__ */ jsx(IconButton, { icon: Star, onClick: addBookmark, title: "Bookmark" }),
        /* @__PURE__ */ jsx(IconButton, { icon: Maximize2, onClick: toggleFullscreen, title: "Fullscreen" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1", children: [
        /* @__PURE__ */ jsx(IconButton, { icon: Minus, onClick: zoomOut, title: "Zoom out", disabled: (activeTab?.zoom ?? 1) <= MIN_ZOOM }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: resetZoom, title: "Reset zoom", "aria-label": "Reset zoom", className: "min-w-[3rem] px-2 text-xs font-medium text-text-secondary hover:text-text transition-colors", children: [
          Math.round((activeTab?.zoom ?? 1) * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsx(IconButton, { icon: Plus, onClick: zoomIn, title: "Zoom in", disabled: (activeTab?.zoom ?? 1) >= MAX_ZOOM })
      ] })
    ] }),
    showHistory && /* @__PURE__ */ jsx("div", { className: "absolute top-20 right-4 z-20 w-80 max-h-96 overflow-auto rounded-xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-2", children: /* @__PURE__ */ jsx(HistoryDropdown, { onSelect: handleNavigate, onClose: () => setShowHistory(false) }) }),
    showDownloads && /* @__PURE__ */ jsx("div", { className: "absolute top-20 right-4 z-20 w-96 max-h-96 overflow-auto rounded-xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-2", children: /* @__PURE__ */ jsx(
      DownloadDropdown,
      {
        downloads,
        onClear: () => {
          setDownloads(clearDownloads());
          showToast("Downloads cleared", "info");
        },
        onRemove: (id) => setDownloads(removeDownload(id))
      }
    ) }),
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
      tabs.map((tab) => {
        const zoom = tab.zoom ?? 1;
        return /* @__PURE__ */ jsx("div", { className: classNames("absolute inset-0 overflow-hidden", tab.active ? "block" : "hidden"), children: /* @__PURE__ */ jsx(
          "iframe",
          {
            ref: (el) => {
              iframeRefs.current[tab.id] = el;
            },
            title: tab.title,
            src: proxyReady ? encodeProxyUrl(tab.url) : "about:blank",
            className: "origin-top-left border-0",
            style: {
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`
            },
            sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
          }
        ) }, `${tab.id}-${tab.reloadKey}`);
      })
    ] })
  ] });
}
function DownloadDropdown({ downloads, onClear, onRemove }) {
  const pendingCount = downloads.filter((d) => d.status === "pending").length;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-white/10", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-text", children: [
        "Downloads ",
        pendingCount > 0 ? /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs text-accent", children: [
          "(",
          pendingCount,
          ")"
        ] }) : null
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClear, className: "text-xs text-emerald-400 hover:text-emerald-300", children: "Clear" })
    ] }),
    downloads.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-3 py-4 text-sm text-text-muted text-center", children: "No downloads yet." }) : /* @__PURE__ */ jsx("ul", { className: "py-1", children: downloads.map((download) => /* @__PURE__ */ jsxs("li", { className: "group flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "truncate text-sm text-text", title: download.filename, children: download.filename }),
        /* @__PURE__ */ jsx("span", { className: "truncate text-xs text-text-muted", title: download.url, children: download.url }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-text-secondary", children: [
          formatFileSize(download.size),
          " • ",
          new Date(download.timestamp).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRemove(download.id), title: "Remove", "aria-label": `Remove ${download.filename}`, className: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-secondary opacity-0 transition-all hover:text-emerald-400 group-hover:opacity-100", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
    ] }, download.id)) })
  ] });
}
function HistoryDropdown({ onSelect, onClose }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("armn-history");
      if (raw) setEntries(JSON.parse(raw));
    } catch {
    }
  }, []);
  const clear = () => {
    localStorage.removeItem("armn-history");
    setEntries([]);
    showToast("History cleared", "info");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-white/10", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-text", children: "Recent History" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: clear, className: "text-xs text-emerald-400 hover:text-emerald-300", children: "Clear" })
    ] }),
    entries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-3 py-4 text-sm text-text-muted text-center", children: "No history yet." }) : /* @__PURE__ */ jsx("ul", { className: "py-1", children: entries.map((entry) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "w-full px-3 py-2 text-left text-sm text-text-secondary hover:text-text hover:bg-white/5 transition-colors truncate",
        onClick: () => {
          onSelect(entry.url);
          onClose();
        },
        children: entry.title || entry.url
      }
    ) }, entry.url)) })
  ] });
}

const $$Tabs = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Browser", Browser, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/arman/Desktop/Arm$n/src/components/Browser", "client:component-export": "default" })} ` })}`;
}, "/Users/arman/Desktop/Arm$n/src/pages/tabs.astro", void 0);

const $$file = "/Users/arman/Desktop/Arm$n/src/pages/tabs.astro";
const $$url = "/tabs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tabs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
