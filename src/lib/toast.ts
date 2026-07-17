export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration: number;
}

let container: HTMLDivElement | null = null;
const toasts = new Map<string, Toast>();

function ensureContainer(): HTMLDivElement {
  if (container) return container;

  container = document.createElement("div");
  container.id = "toast-container";
  container.className = "fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none";
  document.body.appendChild(container);
  return container;
}

const ICONS: Record<Toast["type"], string> = {
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
};

function renderToast(toast: Toast) {
  const el = document.createElement("div");
  el.id = `toast-${toast.id}`;
  el.className = "pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border bg-background/95 backdrop-blur-md shadow-lg text-sm transform transition-all duration-300 translate-x-full opacity-0";

  const colorClass = toast.type === "error" ? "border-emerald-500/30 text-emerald-400" : toast.type === "success" ? "border-accent/30 text-accent" : "border-white/10 text-text-secondary";
  el.classList.add(...colorClass.split(" "));

  el.innerHTML = `<span class="font-semibold">${ICONS[toast.type]}</span><span>${escapeHtml(toast.message)}</span>`;

  const containerEl = ensureContainer();
  containerEl.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.remove("translate-x-full", "opacity-0");
  });

  setTimeout(() => {
    el.classList.add("translate-x-full", "opacity-0");
    el.addEventListener("transitionend", () => {
      el.remove();
      toasts.delete(toast.id);
    });
  }, toast.duration);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function showToast(message: string, type: Toast["type"] = "info", duration = 3000) {
  const toast: Toast = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    message,
    type,
    duration,
  };
  toasts.set(toast.id, toast);
  renderToast(toast);
}
