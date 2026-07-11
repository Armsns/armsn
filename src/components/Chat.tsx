import { Plus, Search, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Conversation {
  id: string;
  name: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  participants?: string[];
  last_message?: string;
  last_message_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
}

interface ChatEvent {
  type: "message";
  conversationId: string;
  message: Message;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newParticipants, setNewParticipants] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [sending, setSending] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const hasSelectedInitial = useRef(false);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedId), [conversations, selectedId]);

  const selectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setShowThread(true);
  }, []);

  const displayTitle = useCallback(
    (conversation?: Conversation) => {
      if (!conversation) return "Messages";
      if (conversation.name) return conversation.name;
      const others = (conversation.participants ?? []).filter((p) => p !== currentUsername);
      if (others.length === 0) return "You";
      return others.join(", ");
    },
    [currentUsername],
  );

  const loadConversations = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = (await sessionRes.json()) as { user?: string };
        if (sessionData.user) {
          setCurrentUsername(sessionData.user);
        }
      }

      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = (await res.json()) as { conversations: Conversation[] };
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

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = (await res.json()) as { messages: Message[] };
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
        const data = JSON.parse(event.data) as ChatEvent;
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
                last_message_at: data.message.created_at,
              },
              ...prev.filter((c) => c.id !== data.conversationId),
            ];
          });
        }
      } catch {
        // ignore malformed events
      }
    });

    eventSource.addEventListener("error", () => {
      eventSource.close();
      if (reconnectAttempts.current < 5) {
        reconnectAttempts.current += 1;
        setTimeout(() => connectStream(), 3000);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to send message");
      }

      const data = (await res.json()) as { message: Message };
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernames = newParticipants
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (usernames.length === 0) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames,
          name: newGroupName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to create conversation");
      }

      const data = (await res.json()) as { conversation: Conversation };
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
    const groups: { date: string; messages: Message[] }[] = [];
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

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {/* Conversations sidebar */}
      <div className="w-full md:w-80 flex flex-col border-r border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Messages</h2>
          <button type="button" onClick={() => setShowNewConversation(true)} className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text hover:bg-white/10 transition-colors" aria-label="New conversation">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-text-secondary text-sm">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">{search ? "No conversations found" : "No conversations yet. Start one!"}</div>
          ) : (
            filteredConversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => selectConversation(conversation.id)} className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-white/5 ${selectedId === conversation.id ? "bg-white/10" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">{displayTitle(conversation).charAt(0).toUpperCase() || "?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text truncate">{displayTitle(conversation)}</span>
                    {conversation.last_message_at && <span className="text-xs text-text-muted shrink-0">{formatTime(conversation.last_message_at)}</span>}
                  </div>
                  <p className="text-sm text-text-secondary truncate">{conversation.last_message || "No messages yet"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className={`flex-1 flex-col ${showThread ? "flex" : "hidden md:flex"}`}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button type="button" onClick={() => setShowThread(false)} className="md:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors" aria-label="Back to conversations">
                ←
              </button>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">{displayTitle(selectedConversation).charAt(0).toUpperCase() || "?"}</div>
              <div>
                <h3 className="font-medium text-text">{displayTitle(selectedConversation)}</h3>
                <p className="text-xs text-text-secondary">{(selectedConversation.participants ?? []).length > 2 ? `${selectedConversation.participants?.length ?? 0} members` : "Direct message"}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-400/10 text-red-400 text-sm text-center">
                  {error}
                  <button type="button" onClick={() => setError(null)} className="ml-2 underline">
                    Dismiss
                  </button>
                </div>
              )}

              {groupedMessages.map((group) => (
                <div key={group.date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-text-muted">{group.date}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  {group.messages.map((message) => {
                    const isMe = message.sender_username === currentUsername;
                    return (
                      <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? "bg-accent text-background rounded-br-none" : "bg-white/10 text-text rounded-bl-none"}`}>
                          {!isMe && <p className="text-xs font-medium text-accent mb-1">{message.sender_username}</p>}
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-background/70" : "text-text-muted"}`}>{formatTime(message.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend(e);
                  }
                }}
                placeholder="Message..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-32 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 resize-none"
              />
              <button type="submit" disabled={!input.trim() || sending} className="h-11 px-5 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      {showNewConversation && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewConversation(false)} aria-label="Close new conversation modal" />
          <form onSubmit={handleCreateConversation} className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-text">New Conversation</h3>
              <button type="button" onClick={() => setShowNewConversation(false)} className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="participants" className="block text-sm font-medium text-text-secondary">
                Usernames (comma separated)
              </label>
              <input
                id="participants"
                value={newParticipants}
                onChange={(e) => setNewParticipants(e.target.value)}
                placeholder="alice, bob"
                className="w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="group-name" className="block text-sm font-medium text-text-secondary">
                Group Name (optional)
              </label>
              <input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="My Group" className="w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 transition-all" />
            </div>

            <button type="submit" disabled={!newParticipants.trim()} className="w-full h-12 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Create Conversation
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
