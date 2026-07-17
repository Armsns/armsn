export interface Download {
  id: string;
  url: string;
  filename: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
  size?: number;
}

const STORAGE_KEY = "armn-downloads";
const MAX_DOWNLOADS = 50;

export function loadDownloads(): Download[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Download[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDownloads(downloads: Download[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
  } catch {
    // ignore
  }
}

export function addDownload(download: Omit<Download, "id" | "timestamp">, prev: Download[] = loadDownloads()): Download[] {
  const newDownload: Download = {
    ...download,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  const updated = [newDownload, ...prev].slice(0, MAX_DOWNLOADS);
  saveDownloads(updated);
  return updated;
}

export function updateDownload(id: string, updates: Partial<Download>): Download[] {
  const downloads = loadDownloads();
  const updated = downloads.map((d) => (d.id === id ? { ...d, ...updates } : d));
  saveDownloads(updated);
  return updated;
}

export function removeDownload(id: string): Download[] {
  const downloads = loadDownloads();
  const updated = downloads.filter((d) => d.id !== id);
  saveDownloads(updated);
  return updated;
}

export function clearDownloads(): Download[] {
  saveDownloads([]);
  return [];
}

export function formatFileSize(bytes?: number): string {
  if (bytes == null) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/");
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  } catch {
    // ignore
  }
  return "download";
}
