import { Clock, Globe, Plus, Search, Trash2, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRoute } from "@/lib/obf-helpers";
import { formatUrl } from "@/lib/tabs";

interface Favorite {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const STORAGE_KEY = "armn-home-favorites";

const DEFAULT_FAVORITES: Favorite[] = [
  { id: "google", name: "Google", url: "https://google.com", icon: "https://www.google.com/favicon.ico" },
  { id: "youtube", name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/favicon.ico" },
  { id: "reddit", name: "Reddit", url: "https://reddit.com", icon: "https://www.reddit.com/favicon.ico" },
  { id: "github", name: "GitHub", url: "https://github.com", icon: "https://github.com/favicon.ico" },
];

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Favorite[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FAVORITES;
}

function saveFavorites(favorites: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return true;
  return value.includes(".") && !value.includes(" ");
}

function normalizeUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function getFavicon(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}

function handleFaviconError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.src = "/favicon.svg";
}

export default function HomeDashboard() {
  const [time, setTime] = useState(new Date());
  const [favorites, setFavorites] = useState<Favorite[]>(DEFAULT_FAVORITES);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [proxyReady, setProxyReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkProxy = () => {
      const hasScramjet = Boolean((window as Window & { __scramjet$config?: unknown }).__scramjet$config);
      const swReady = Boolean(navigator.serviceWorker?.controller);
      setProxyReady(hasScramjet && swReady);
    };
    checkProxy();
    const id = setInterval(checkProxy, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleOpen = useCallback((url: string) => {
    sessionStorage.setItem("goUrl", url);
    location.replace(getRoute("tabs"));
  }, []);

  const handleSearch = useCallback(() => {
    const raw = searchInputRef.current?.value ?? "";
    const url = formatUrl(raw);
    handleOpen(url);
  }, [handleOpen]);

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !isValidUrl(url)) return;
    const normalized = normalizeUrl(url);
    const favorite: Favorite = {
      id: generateId(),
      name,
      url: normalized,
      icon: getFavicon(normalized),
    };
    setFavorites((prev) => [favorite, ...prev]);
    setNewName("");
    setNewUrl("");
    setIsAdding(false);
  }, [newName, newUrl]);

  const handleRemove = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewName("");
      setNewUrl("");
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="w-full max-w-3xl mt-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="sm:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-white/[0.05]">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Local Time</span>
          </div>
          <div className="mt-2 font-display text-4xl font-black tracking-tight text-text tabular-nums">{formatTime(time)}</div>
          <div className="mt-1 text-sm text-text-secondary">{formatDate(time)}</div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all ${proxyReady ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"}`}>
          <div className="flex items-center gap-3">
            {proxyReady ? <Wifi className="h-5 w-5 text-emerald-400" /> : <WifiOff className="h-5 w-5 text-amber-400" />}
            <span className={`text-xs font-semibold uppercase tracking-wider ${proxyReady ? "text-emerald-400" : "text-amber-400"}`}>Proxy</span>
          </div>
          <div className={`mt-2 font-display text-lg font-bold ${proxyReady ? "text-emerald-400" : "text-amber-400"}`}>{proxyReady ? "Ready" : "Connecting"}</div>
          <div className="mt-1 text-xs text-text-secondary">{proxyReady ? "Scramjet + SW active" : "Waiting for service worker"}</div>
        </div>
      </div>

      <div className="relative w-full mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-accent transition-colors" strokeWidth={2} />
          <input
            ref={searchInputRef}
            id="search"
            className="w-full h-14 pl-12 pr-5 rounded-xl bg-white/[0.03] border border-white/10 text-base text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] focus:shadow-glow transition-all"
            placeholder="Search or enter URL"
            type="search"
            autoComplete="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-text-muted">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-text-secondary font-mono text-[10px]">Enter</kbd> to browse
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/15">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Quick Access</span>
          </div>
          <button type="button" onClick={() => setIsAdding((prev) => !prev)} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-white/10 hover:text-text">
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {isAdding && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3 animate-fade-in">
            <input
              ref={inputRef}
              id="favorite-name"
              name="favorite-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Site name"
              aria-label="Site name"
              className="h-9 rounded-lg bg-white/5 px-3 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <input
              id="favorite-url"
              name="favorite-url"
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="URL (e.g. google.com)"
              aria-label="Site URL"
              className="h-9 rounded-lg bg-white/5 px-3 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewName("");
                  setNewUrl("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text"
              >
                Cancel
              </button>
              <button type="button" onClick={handleAdd} disabled={!newName.trim() || !isValidUrl(newUrl.trim())} className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">
                Save
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="group relative flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:-translate-y-1 hover:border-accent/30 hover:bg-white/[0.08] hover:shadow-glow">
              <button type="button" onClick={() => handleOpen(favorite.url)} className="flex w-full flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/5">
                  <img src={favorite.icon} alt="" className="h-full w-full object-contain p-1" onError={handleFaviconError} />
                </div>
                <span className="w-full truncate text-center text-xs font-medium text-text">{favorite.name}</span>
              </button>
              <button type="button" onClick={() => handleRemove(favorite.id)} className="absolute right-1.5 top-1.5 rounded-full p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white/10 hover:text-rose-400" aria-label={`Remove ${favorite.name}`}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
