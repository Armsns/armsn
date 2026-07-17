export interface HistoryEntry {
  url: string;
  title: string;
  favicon?: string;
  timestamp: number;
}

const STORAGE_KEY = "armn-history";
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "timestamp">) {
  try {
    const history = getHistory();
    const newEntry: HistoryEntry = { ...entry, timestamp: Date.now() };

    const filtered = history.filter((h) => h.url !== entry.url);
    filtered.unshift(newEntry);

    if (filtered.length > MAX_ENTRIES) {
      filtered.length = MAX_ENTRIES;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore storage errors
  }
}

export function removeHistoryEntry(url: string) {
  try {
    const history = getHistory().filter((h) => h.url !== url);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
