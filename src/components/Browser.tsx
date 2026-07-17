import { ChevronLeft, ChevronRight, Clock, Download as DownloadIcon, Home, Lock, Maximize2, Minus, Plus, RotateCw, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDownload, clearDownloads, type Download, formatFileSize, getFilenameFromUrl, loadDownloads, removeDownload } from "@/lib/downloads";
import { addHistoryEntry } from "@/lib/history";
import { actionBarClass, addressInputClass, classNames, closeButtonClass, encodeProxyUrl, formatUrl, getActualUrl, getDefaultUrl, iconButtonClass, type Tab, tabButtonClass } from "@/lib/tabs";
import { showToast } from "@/lib/toast";

type ScramjetWindow = Window & { __scramjet$config?: unknown };

const IconButton = ({ onClick, icon: Icon, className = "", disabled = false, title = "" }: { onClick?: () => void; icon: React.ComponentType<{ className?: string }>; className?: string; disabled?: boolean; title?: string }) => (
  <button type="button" onClick={onClick} disabled={disabled} title={title} className={classNames(iconButtonClass, "disabled:opacity-30 disabled:cursor-not-allowed", className)}>
    <Icon className="h-4 w-4" />
  </button>
);

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: "Tab 1", url: "about:blank", active: true, reloadKey: 0, pinned: false, zoom: 1 }]);
  const [url, setUrl] = useState("about:blank");
  const [favicons, setFavicons] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Array<{ Title: string; url: string; favicon?: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const addDownloadEntry = useCallback((download: Omit<Download, "id" | "timestamp">) => {
    setDownloads((prev) => addDownload(download, prev));
  }, []);
  const [_proxyReadyTick, setProxyReadyTick] = useState(0);
  const [proxyReady, setProxyReady] = useState(false);
  const activeTab = useMemo(() => tabs.find((tab) => tab.active), [tabs]);
  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});

  const openInNewTab = useCallback((url: string) => {
    const newId = Date.now();
    setTabs((prev) => [...prev.map((t) => ({ ...t, active: false })), { id: newId, title: "New Tab", url, active: true, reloadKey: 0, pinned: false, zoom: 1 }]);
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
    if ((window as ScramjetWindow).__scramjet$config) {
      onReady();
    }
    return () => window.removeEventListener("scramjet-ready", onReady);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkReady = () => {
      const sjReady = Boolean((window as ScramjetWindow).__scramjet$config);
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

    let observer: MutationObserver | null = null;

    const updateState = () => {
      const actualUrl = getActualUrl(iframe);
      if (actualUrl && actualUrl !== "about:blank" && actualUrl !== url) setUrl(actualUrl);

      try {
        const iframeTitle = iframe.contentWindow?.document?.title;
        if (iframeTitle && iframeTitle !== activeTab.title) {
          setTabs((prev) => prev.map((tab) => (tab.id === activeTab.id ? { ...tab, title: iframeTitle } : tab)));
        }

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          const faviconLink = iframeDoc.querySelector<HTMLLinkElement>('link[rel="icon"]') || iframeDoc.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]') || iframeDoc.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');

          if (faviconLink?.href) {
            setFavicons((prev) => ({ ...prev, [activeTab.id]: faviconLink.href }));
          } else if (actualUrl) {
            try {
              const urlObj = new URL(actualUrl);
              setFavicons((prev) => ({ ...prev, [activeTab.id]: `${urlObj.origin}/favicon.ico` }));
            } catch (_e) {}
          }
        }
      } catch (_e) {}
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
            attributeFilter: ["href"],
          });
        }

        const titleEl = iframeDoc.querySelector("title");
        if (titleEl) {
          observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
        }
      } catch (_e) {}
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
        const iframeWindow = iframe.contentWindow as Window & {
          __tabInterceptSetup?: boolean;
          __originalOpen?: typeof window.open;
        };
        if (!iframeWindow || iframeWindow.__tabInterceptSetup) return;

        iframeWindow.__tabInterceptSetup = true;

        const originalOpen = iframeWindow.open;
        iframeWindow.__originalOpen = originalOpen;

        iframeWindow.open = (url?: string | URL, target?: string, features?: string) => {
          if (!target || target === "_blank" || target === "_new") {
            try {
              const urlStr = url?.toString() || "";
              const fullUrl = urlStr ? new URL(urlStr, iframeWindow.location.href).href : "about:blank";
              openInNewTab(fullUrl);
              return null;
            } catch (err) {
              console.warn("Failed to intercept window.open:", err);
            }
          }
          return originalOpen.call(iframeWindow, url, target, features);
        };

        const handleClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
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

        const handleAuxClick = (e: MouseEvent) => {
          if (e.button !== 1) return;

          const target = e.target as HTMLElement;
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

        const handleDownload = (e: Event) => {
          try {
            const raw = (e as Event & { download?: { url?: string; filename?: string } }).download;
            const url = typeof raw?.url === "string" ? raw.url : "";
            const filename = typeof raw?.filename === "string" && raw.filename ? raw.filename : getFilenameFromUrl(url || iframeWindow.location.href);
            addDownloadEntry({ url: url || iframeWindow.location.href, filename, status: "pending" });
            showToast(`Download started: ${filename}`, "info");
          } catch (err) {
            console.warn("Failed to handle download event:", err);
          }
        };

        iframeWindow.addEventListener("download", handleDownload, { signal });
      } catch (_err) {}
    };

    const handleLoad = () => {
      setupIntercept();
    };

    iframe.addEventListener("load", handleLoad, { signal });
    setupIntercept();

    return () => {
      abortController.abort();
      try {
        const iframeWindow = iframe.contentWindow as Window & {
          __tabInterceptSetup?: boolean;
          __originalOpen?: typeof window.open;
        };
        if (iframeWindow?.__originalOpen) {
          iframeWindow.open = iframeWindow.__originalOpen;
          iframeWindow.__tabInterceptSetup = false;
        }
      } catch (_e) {}
    };
  }, [activeTab, openInNewTab, addDownloadEntry]);

  const setActiveTab = (id: number) => {
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

  const closeTab = useCallback((id: number) => {
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

  const togglePinTab = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== id) return tab;
        const pinned = !tab.pinned;
        showToast(pinned ? "Tab pinned" : "Tab unpinned", "success");
        return { ...tab, pinned };
      }),
    );
  };

  const handleNavigate = (value: string) => {
    if (!activeTab) return;
    const formattedUrl = formatUrl(value);
    setTabs((prev) => prev.map((tab) => (tab.id === activeTab.id ? { ...tab, url: formattedUrl, reloadKey: tab.reloadKey + 1 } : tab)));
    setUrl(formattedUrl);

    if (formattedUrl !== "about:blank") {
      addHistoryEntry({ url: formattedUrl, title: formattedUrl });
    }
  };

  const removeBookmark = (bookmarkUrl: string, bookmarkTitle: string) => {
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
    (action: "back" | "forward" | "reload" | "home") => {
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
    [activeTab],
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

  const setZoom = useCallback((id: number, zoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(2))));
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, zoom: clamped } : tab)));
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
    const handleKeyDown = (e: KeyboardEvent) => {
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

    const handleAuxClick = (e: MouseEvent) => {
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center gap-1 bg-background-secondary/50 px-2 py-1.5 border-b border-border/50">
        {sortedTabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={classNames(tabButtonClass, tab.active ? "bg-background text-text border border-border/50" : "text-text-secondary hover:text-text hover:bg-white/5", tab.pinned && "max-w-[80px]")}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {tab.pinned ? (
                <span className="text-accent text-xs">📌</span>
              ) : favicons[tab.id] ? (
                <img
                  src={favicons[tab.id]}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={classNames("h-3.5 w-3.5 shrink-0 rounded-sm bg-accent/20", favicons[tab.id] ? "hidden" : "")} />
              <span className="truncate text-xs">{tab.pinned ? "" : tab.title}</span>
            </div>
            <button
              type="button"
              className={closeButtonClass}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePinTab(tab.id);
              }}
              aria-label={`Close ${tab.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
        <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:text-accent hover:bg-white/5 transition-all" onClick={addNewTab} aria-label="Add tab">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-background px-2 py-1.5 border-b border-border/30">
        <div className="flex items-center gap-0.5">
          <IconButton icon={Home} onClick={() => handleAction("home")} title="Home" />
          <IconButton icon={ChevronLeft} onClick={() => handleAction("back")} title="Back" />
          <IconButton icon={ChevronRight} onClick={() => handleAction("forward")} title="Forward" />
          <IconButton icon={RotateCw} onClick={() => handleAction("reload")} title="Reload" />
        </div>

        <div className="flex-1">
          <div className={actionBarClass}>
            <Lock className="h-3.5 w-3.5 text-text-placeholder" />
            <input ref={addressInputRef} className={addressInputClass} value={url} placeholder="Search or enter address" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNavigate(e.currentTarget.value)} />
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <IconButton
            icon={Clock}
            onClick={() => {
              setShowDownloads(false);
              setShowHistory((prev) => !prev);
            }}
            title="History"
            className={showHistory ? "text-accent" : ""}
          />
          <IconButton
            icon={DownloadIcon}
            onClick={() => {
              setShowHistory(false);
              setShowDownloads((prev) => !prev);
            }}
            title="Downloads"
            className={showDownloads ? "text-accent" : ""}
          />
          <IconButton icon={Star} onClick={addBookmark} title="Bookmark" />
          <IconButton icon={Maximize2} onClick={toggleFullscreen} title="Fullscreen" />
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1">
          <IconButton icon={Minus} onClick={zoomOut} title="Zoom out" disabled={(activeTab?.zoom ?? 1) <= MIN_ZOOM} />
          <button type="button" onClick={resetZoom} title="Reset zoom" aria-label="Reset zoom" className="min-w-[3rem] px-2 text-xs font-medium text-text-secondary hover:text-text transition-colors">
            {Math.round((activeTab?.zoom ?? 1) * 100)}%
          </button>
          <IconButton icon={Plus} onClick={zoomIn} title="Zoom in" disabled={(activeTab?.zoom ?? 1) >= MAX_ZOOM} />
        </div>
      </div>

      {showHistory && (
        <div className="absolute top-20 right-4 z-20 w-80 max-h-96 overflow-auto rounded-xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-2">
          <HistoryDropdown onSelect={handleNavigate} onClose={() => setShowHistory(false)} />
        </div>
      )}

      {showDownloads && (
        <div className="absolute top-20 right-4 z-20 w-96 max-h-96 overflow-auto rounded-xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-2">
          <DownloadDropdown
            downloads={downloads}
            onClear={() => {
              setDownloads(clearDownloads());
              showToast("Downloads cleared", "info");
            }}
            onRemove={(id) => setDownloads(removeDownload(id))}
          />
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="flex items-center gap-1 bg-background px-2 py-1 overflow-x-auto border-b border-border/30">
          {bookmarks.map((bookmark) => (
            <button
              key={`${bookmark.url}-${bookmark.Title}`}
              type="button"
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary hover:text-text hover:bg-white/5 transition-all shrink-0"
              style={{ maxWidth: "160px" }}
              onClick={() => handleNavigate(bookmark.url)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (confirm(`Remove bookmark "${bookmark.Title}"?`)) removeBookmark(bookmark.url, bookmark.Title);
              }}
            >
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <Star className={classNames("h-3.5 w-3.5 shrink-0", bookmark.favicon ? "hidden" : "")} />
              <span className="truncate">{bookmark.Title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 bg-background">
        {!proxyReady && activeTab?.url !== "about:blank" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="flex items-center gap-3 text-text-secondary">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" style={{ animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <span className="text-sm">Loading proxy…</span>
            </div>
          </div>
        )}
        {tabs.map((tab) => {
          const zoom = tab.zoom ?? 1;
          return (
            <div key={`${tab.id}-${tab.reloadKey}`} className={classNames("absolute inset-0 overflow-hidden", tab.active ? "block" : "hidden")}>
              <iframe
                ref={(el) => {
                  iframeRefs.current[tab.id] = el;
                }}
                title={tab.title}
                src={proxyReady ? encodeProxyUrl(tab.url) : "about:blank"}
                className="origin-top-left border-0"
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  transform: `scale(${zoom})`,
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DownloadDropdown({ downloads, onClear, onRemove }: { downloads: Download[]; onClear: () => void; onRemove: (id: string) => void }) {
  const pendingCount = downloads.filter((d) => d.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-medium text-text">Downloads {pendingCount > 0 ? <span className="ml-1 text-xs text-accent">({pendingCount})</span> : null}</span>
        <button type="button" onClick={onClear} className="text-xs text-emerald-400 hover:text-emerald-300">
          Clear
        </button>
      </div>
      {downloads.length === 0 ? (
        <p className="px-3 py-4 text-sm text-text-muted text-center">No downloads yet.</p>
      ) : (
        <ul className="py-1">
          {downloads.map((download) => (
            <li key={download.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-text" title={download.filename}>
                  {download.filename}
                </span>
                <span className="truncate text-xs text-text-muted" title={download.url}>
                  {download.url}
                </span>
                <span className="text-xs text-text-secondary">
                  {formatFileSize(download.size)} • {new Date(download.timestamp).toLocaleString()}
                </span>
              </div>
              <button type="button" onClick={() => onRemove(download.id)} title="Remove" aria-label={`Remove ${download.filename}`} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-secondary opacity-0 transition-all hover:text-emerald-400 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryDropdown({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [entries, setEntries] = useState<{ url: string; title: string; timestamp: number }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("armn-history");
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const clear = () => {
    localStorage.removeItem("armn-history");
    setEntries([]);
    showToast("History cleared", "info");
  };

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-medium text-text">Recent History</span>
        <button type="button" onClick={clear} className="text-xs text-emerald-400 hover:text-emerald-300">
          Clear
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="px-3 py-4 text-sm text-text-muted text-center">No history yet.</p>
      ) : (
        <ul className="py-1">
          {entries.map((entry) => (
            <li key={entry.url}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:text-text hover:bg-white/5 transition-colors truncate"
                onClick={() => {
                  onSelect(entry.url);
                  onClose();
                }}
              >
                {entry.title || entry.url}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
