import { AppWindow, Gamepad2, Globe, Home, LayoutGrid, MessageSquare, Search, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRoute } from "@/lib/obf-helpers";

type PaletteItem = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

const staticItems: PaletteItem[] = [
  {
    id: "home",
    name: "Home",
    icon: Home,
    action: () => {
      window.location.href = "/";
    },
  },
  {
    id: "games",
    name: "Games",
    icon: Gamepad2,
    action: () => {
      window.location.href = getRoute("games");
    },
  },
  {
    id: "apps",
    name: "Apps",
    icon: LayoutGrid,
    action: () => {
      window.location.href = getRoute("apps");
    },
  },
  {
    id: "tabs",
    name: "Tabs",
    icon: AppWindow,
    action: () => {
      window.location.href = getRoute("tabs");
    },
  },
  {
    id: "chat",
    name: "Chat",
    icon: MessageSquare,
    action: () => {
      window.location.href = getRoute("chat");
    },
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings2,
    action: () => {
      window.location.href = getRoute("settings");
    },
  },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return staticItems;
    const urlItems: PaletteItem[] = [];
    if (/^https?:\/\//i.test(lowerQuery) || lowerQuery.includes(".")) {
      const url = lowerQuery.startsWith("http") ? lowerQuery : `https://${lowerQuery}`;
      urlItems.push({
        id: "navigate-url",
        name: `Navigate to ${url}`,
        icon: Globe,
        action: () => {
          sessionStorage.setItem("goUrl", url);
          window.location.href = getRoute("tabs");
        },
      });
    }

    const filtered = staticItems.filter((item) => item.name.toLowerCase().includes(lowerQuery));
    return [...urlItems, ...filtered];
  }, [query]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        item.action();
        setIsOpen(false);
      }
    },
    [items],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} aria-label="Close command palette" />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-text-secondary" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search pages or type a URL..." className="flex-1 bg-transparent text-text placeholder:text-text-placeholder focus:outline-none text-base" />
          <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-white/10 text-text-secondary text-xs font-mono">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">No results found.</p>
          ) : (
            items.map((item, index) => (
              <button key={item.id} type="button" onClick={() => handleSelect(index)} onMouseEnter={() => setSelectedIndex(index)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${index === selectedIndex ? "bg-white/10 text-text" : "text-text-secondary hover:bg-white/5"}`}>
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                {index === selectedIndex && <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-text-muted text-xs font-mono">Enter</kbd>}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-text-muted">
          <span>{items.length} result(s)</span>
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
