interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

let messages: ChatMessage[] = [];
let currentEventSource: EventSource | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function renderMessages() {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<p class="text-center text-text-muted text-sm">No messages yet. Say hello!</p>`;
    return;
  }

  container.innerHTML = messages
    .map(
      (msg) => `
      <div class="flex flex-col gap-1 rounded-xl bg-white/[0.05] p-3 border border-white/5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-accent">${escapeHtml(msg.user)}</span>
          <span class="text-xs text-text-muted">${formatTime(msg.time)}</span>
        </div>
        <p class="text-sm text-text-secondary whitespace-pre-wrap break-words">${escapeHtml(msg.text)}</p>
      </div>
    `,
    )
    .join("");

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadMessages() {
  try {
    const res = await fetch("/api/chat/messages");
    if (!res.ok) throw new Error("Failed to load messages");
    const data = (await res.json()) as { messages: ChatMessage[] };
    messages = data.messages || [];
    renderMessages();
  } catch {
    const container = document.getElementById("chat-messages");
    if (container) {
      container.innerHTML = `<p class="text-center text-red-400 text-sm">Failed to load messages.</p>`;
    }
  }
}

function connectStream() {
  if (currentEventSource) {
    try {
      currentEventSource.close();
    } catch {}
  }

  const eventSource = new EventSource("/api/chat/stream");
  currentEventSource = eventSource;

  eventSource.addEventListener("open", () => {
    reconnectAttempts = 0;
  });

  eventSource.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data) as ChatMessage;
      const existing = messages.find((m) => m.id === msg.id);
      if (!existing) {
        messages.push(msg);
        if (messages.length > 100) messages = messages.slice(-100);
        renderMessages();
      }
    } catch {
      // ignore malformed messages
    }
  });

  eventSource.addEventListener("error", () => {
    eventSource.close();
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      const container = document.getElementById("chat-messages");
      if (container) {
        container.innerHTML = `<p class="text-center text-red-400 text-sm">Chat connection failed. Please refresh.</p>`;
      }
      return;
    }
    reconnectAttempts++;
    setTimeout(() => connectStream(), 3000);
  });
}

async function sendMessage(text: string) {
  const res = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }
}

function initChat() {
  const form = document.getElementById("chat-form") as HTMLFormElement | null;
  const input = document.getElementById("chat-input") as HTMLTextAreaElement | null;

  if (!form || !input) return;

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";
    input.disabled = true;

    try {
      await sendMessage(text);
    } catch {
      alert("Failed to send message");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });

  void loadMessages();
  connectStream();
}

document.addEventListener("astro:page-load", initChat);
