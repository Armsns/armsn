import { c as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_qhutUUez.mjs';
import 'piccolore';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Plus, Search, Send, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { $ as $$Main } from '../chunks/Main_kDsPl02p.mjs';
export { renderers } from '../renderers.mjs';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newParticipants, setNewParticipants] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [sending, setSending] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const hasSelectedInitial = useRef(false);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedId), [conversations, selectedId]);
  const selectConversation = useCallback((id) => {
    setSelectedId(id);
    setShowThread(true);
  }, []);
  const displayTitle = useCallback(
    (conversation) => {
      if (!conversation) return "Messages";
      if (conversation.name) return conversation.name;
      const others = (conversation.participants ?? []).filter((p) => p !== currentUsername);
      if (others.length === 0) return "You";
      return others.join(", ");
    },
    [currentUsername]
  );
  const loadConversations = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.user) {
          setCurrentUsername(sessionData.user);
        }
      }
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.conversations);
      if (data.conversations.length > 0 && !hasSelectedInitial.current) {
        hasSelectedInitial.current = true;
        setSelectedId(data.conversations[0].id);
        setShowThread(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadMessages = useCallback(async (conversationId) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  }, []);
  const connectStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const eventSource = new EventSource("/api/conversations/stream");
    eventSourceRef.current = eventSource;
    eventSource.addEventListener("open", () => {
      reconnectAttempts.current = 0;
    });
    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => {
            if (data.conversationId !== selectedIdRef.current || prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setConversations((prev) => {
            const conversation = prev.find((c) => c.id === data.conversationId);
            if (!conversation) return prev;
            return [
              {
                ...conversation,
                last_message: data.message.content,
                last_message_at: data.message.created_at
              },
              ...prev.filter((c) => c.id !== data.conversationId)
            ];
          });
        }
      } catch {
      }
    });
    eventSource.addEventListener("error", () => {
      eventSource.close();
      if (reconnectAttempts.current < 5) {
        reconnectAttempts.current += 1;
        setTimeout(() => connectStream(), 3e3);
      }
    });
  }, []);
  useEffect(() => {
    void loadConversations();
    connectStream();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [loadConversations, connectStream]);
  useEffect(() => {
    if (selectedId) {
      void loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);
  const messageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > messageCountRef.current) {
      messageCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedId || !input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() })
      });
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error || "Failed to send message");
      }
      const data = await res.json();
      setMessages((prev) => prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };
  const handleCreateConversation = async (e) => {
    e.preventDefault();
    const usernames = newParticipants.split(",").map((u) => u.trim()).filter(Boolean);
    if (usernames.length === 0) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames,
          name: newGroupName.trim() || void 0
        })
      });
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error || "Failed to create conversation");
      }
      const data = await res.json();
      setConversations((prev) => [data.conversation, ...prev]);
      setSelectedId(data.conversation.id);
      setShowNewConversation(false);
      setNewParticipants("");
      setNewGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    }
  };
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => displayTitle(c).toLowerCase().includes(query));
  }, [conversations, search, displayTitle]);
  const groupedMessages = useMemo(() => {
    const groups = [];
    for (const message of messages) {
      const date = formatDate(message.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }
    }
    return groups;
  }, [messages]);
  return /* @__PURE__ */ jsxs("div", { className: "flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full md:w-80 flex flex-col border-r border-white/10", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-white/10 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-text", children: "Messages" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowNewConversation(true), className: "p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text hover:bg-white/10 transition-colors", "aria-label": "New conversation", children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-white/10", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" }),
        /* @__PURE__ */ jsx("input", { type: "search", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search conversations", className: "w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-text-secondary text-sm", children: "Loading conversations..." }) : filteredConversations.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-text-secondary text-sm", children: search ? "No conversations found" : "No conversations yet. Start one!" }) : filteredConversations.map((conversation) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => selectConversation(conversation.id), className: `w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-white/5 ${selectedId === conversation.id ? "bg-white/10" : ""}`, children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0", children: displayTitle(conversation).charAt(0).toUpperCase() || "?" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-text truncate", children: displayTitle(conversation) }),
            conversation.last_message_at && /* @__PURE__ */ jsx("span", { className: "text-xs text-text-muted shrink-0", children: formatTime(conversation.last_message_at) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-text-secondary truncate", children: conversation.last_message || "No messages yet" })
        ] })
      ] }, conversation.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `flex-1 flex-col ${showThread ? "flex" : "hidden md:flex"}`, children: selectedConversation ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-white/10 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowThread(false), className: "md:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors", "aria-label": "Back to conversations", children: "←" }),
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm", children: displayTitle(selectedConversation).charAt(0).toUpperCase() || "?" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-medium text-text", children: displayTitle(selectedConversation) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-text-secondary", children: (selectedConversation.participants ?? []).length > 2 ? `${selectedConversation.participants?.length ?? 0} members` : "Direct message" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-6", children: [
        error && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-red-400/10 text-red-400 text-sm text-center", children: [
          error,
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setError(null), className: "ml-2 underline", children: "Dismiss" })
        ] }),
        groupedMessages.map((group) => /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-white/10" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-text-muted", children: group.date }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-white/10" })
          ] }),
          group.messages.map((message) => {
            const isMe = message.sender_username === currentUsername;
            return /* @__PURE__ */ jsx("div", { className: `flex ${isMe ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? "bg-accent text-background rounded-br-none" : "bg-white/10 text-text rounded-bl-none"}`, children: [
              !isMe && /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-accent mb-1", children: message.sender_username }),
              /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap break-words", children: message.content }),
              /* @__PURE__ */ jsx("p", { className: `text-xs mt-1 ${isMe ? "text-background/70" : "text-text-muted"}`, children: formatTime(message.created_at) })
            ] }) }, message.id);
          })
        ] }, group.date)),
        /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSend, className: "p-4 border-t border-white/10 flex items-end gap-2", children: [
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(e);
              }
            },
            placeholder: "Message...",
            rows: 1,
            className: "flex-1 min-h-[44px] max-h-32 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 resize-none"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: !input.trim() || sending, className: "h-11 px-5 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }) })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-text-secondary", children: /* @__PURE__ */ jsx("p", { children: "Select a conversation to start messaging" }) }) }),
    showNewConversation && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: () => setShowNewConversation(false), "aria-label": "Close new conversation modal" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateConversation, className: "relative w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-text", children: "New Conversation" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowNewConversation(false), className: "p-1 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "participants", className: "block text-sm font-medium text-text-secondary", children: "Usernames (comma separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "participants",
              value: newParticipants,
              onChange: (e) => setNewParticipants(e.target.value),
              placeholder: "alice, bob",
              className: "w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 transition-all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "group-name", className: "block text-sm font-medium text-text-secondary", children: "Group Name (optional)" }),
          /* @__PURE__ */ jsx("input", { id: "group-name", value: newGroupName, onChange: (e) => setNewGroupName(e.target.value), placeholder: "My Group", className: "w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 transition-all" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: !newParticipants.trim(), className: "w-full h-12 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Create Conversation" })
      ] })
    ] })
  ] });
}

const $$Chat = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="pt-24 pb-12 px-4 min-h-screen"> <div class="max-w-6xl mx-auto"> ${renderComponent($$result2, "Chat", Chat, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/Chat.tsx", "client:component-export": "default" })} </div> </div> ` })}`;
}, "G:/armsn/armsn/src/pages/chat.astro", void 0);

const $$file = "G:/armsn/armsn/src/pages/chat.astro";
const $$url = "/chat";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Chat,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
