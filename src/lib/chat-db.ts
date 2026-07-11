import { getSupabaseClient } from "./supabase";

export interface Conversation {
  id: string;
  name: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  participants?: string[];
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
}

export async function getConversationsForUser(userId: number): Promise<Conversation[]> {
  const supabase = getSupabaseClient();

  const { data: participantRows, error: participantError } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", userId);

  if (participantError) {
    throw new Error(`Failed to fetch conversations: ${participantError.message}`);
  }

  const conversationIds = ((participantRows ?? []) as { conversation_id: string }[]).map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return [];
  }

  const { data: conversations, error: conversationError } = await supabase.from("conversations").select("id, name, created_by, created_at, updated_at").in("id", conversationIds).order("updated_at", { ascending: false });

  if (conversationError) {
    throw new Error(`Failed to fetch conversations: ${conversationError.message}`);
  }

  const { data: lastMessages, error: messageError } = await supabase.from("messages").select("conversation_id, content, created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false });

  if (messageError) {
    throw new Error(`Failed to fetch last messages: ${messageError.message}`);
  }

  const lastMessageMap = new Map<string, { content: string; created_at: string }>();
  for (const msg of (lastMessages ?? []) as { conversation_id: string; content: string; created_at: string }[]) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, { content: msg.content, created_at: msg.created_at });
    }
  }

  const { data: allParticipants, error: participantsError } = await supabase.from("conversation_participants").select("conversation_id, users(username)").in("conversation_id", conversationIds);

  if (participantsError) {
    throw new Error(`Failed to fetch participants: ${participantsError.message}`);
  }

  const participantsByConversation = new Map<string, string[]>();
  for (const row of (allParticipants ?? []) as unknown as { conversation_id: string; users: { username: string } }[]) {
    const list = participantsByConversation.get(row.conversation_id) ?? [];
    list.push(row.users.username);
    participantsByConversation.set(row.conversation_id, list);
  }

  return ((conversations ?? []) as Conversation[]).map((conversation) => {
    const last = lastMessageMap.get(conversation.id);
    return {
      ...conversation,
      participants: participantsByConversation.get(conversation.id) ?? [],
      last_message: last?.content,
      last_message_at: last?.created_at,
    };
  });
}

export async function getConversationParticipants(conversationId: string): Promise<{ user_id: number; username: string }[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from("conversation_participants").select("user_id, users(username)").eq("conversation_id", conversationId);

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`);
  }

  return ((data ?? []) as unknown as { user_id: number; users: { username: string } }[]).map((row) => ({
    user_id: row.user_id,
    username: row.users.username,
  }));
}

export async function getMessagesForConversation(conversationId: string, limit = 100, offset = 0): Promise<Message[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, users(username)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return ((data ?? []) as unknown as { id: string; conversation_id: string; sender_id: number; content: string; created_at: string; users: { username: string } }[]).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_username: row.users.username,
    content: row.content,
    created_at: row.created_at,
  }));
}

export async function createConversation(createdBy: number, participantIds: number[], name?: string): Promise<Conversation> {
  const supabase = getSupabaseClient();

  const uniqueParticipants = Array.from(new Set([createdBy, ...participantIds]));

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ name: name ?? null, created_by: createdBy })
    .select()
    .single();

  if (error || !conversation) {
    throw new Error(`Failed to create conversation: ${error?.message ?? "unknown error"}`);
  }

  const participants = uniqueParticipants.map((userId) => ({
    conversation_id: conversation.id as string,
    user_id: userId,
  }));

  const { error: participantError } = await supabase.from("conversation_participants").insert(participants);

  if (participantError) {
    throw new Error(`Failed to add participants: ${participantError.message}`);
  }

  const { data: participantUsernames } = await supabase
    .from("conversation_participants")
    .select("users(username)")
    .eq("conversation_id", conversation.id as string);

  return {
    ...conversation,
    participants: ((participantUsernames ?? []) as unknown as { users: { username: string } }[]).map((row) => row.users.username),
  } as Conversation;
}

export async function userIsInConversation(userId: number, conversationId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase.from("conversation_participants").select("*", { count: "exact", head: true }).eq("conversation_id", conversationId).eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to check conversation membership: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function sendMessage(conversationId: string, senderId: number, content: string): Promise<Message> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, content }).select("id, conversation_id, sender_id, content, created_at, users(username)").single();

  if (error || !data) {
    throw new Error(`Failed to send message: ${error?.message ?? "unknown error"}`);
  }

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  const row = data as unknown as { id: string; conversation_id: string; sender_id: number; content: string; created_at: string; users: { username: string } };

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_username: row.users.username,
    content: row.content,
    created_at: row.created_at,
  };
}

export async function getUserByUsername(username: string): Promise<{ id: number; username: string } | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from("users").select("id, username").ilike("username", username).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data as { id: number; username: string };
}
