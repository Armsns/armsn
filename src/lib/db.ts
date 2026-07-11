import crypto from "node:crypto";
import { promisify } from "node:util";
import { getSupabaseClient } from "./supabase";

const scryptAsync = promisify(crypto.scrypt);

export interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
}

export interface DbSession {
  id: string;
  user_id: number;
  username: string;
  expires_at: number;
  created_at: string;
}

const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}
export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const normalized = username.toLowerCase();
  const { data, error } = await getSupabaseClient().from("users").select("*").eq("username", normalized).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
  return data as DbUser;
}
export async function createUser(username: string, password: string, isAdmin = false): Promise<DbUser> {
  const normalized = username.toLowerCase();
  const passwordHash = await hashPassword(password);
  const { data, error } = await getSupabaseClient().from("users").insert({ username: normalized, password_hash: passwordHash, is_admin: isAdmin }).select().single();

  if (error || !data) {
    throw new Error(`Failed to create user: ${error?.message ?? "unknown error"}`);
  }
  return data as DbUser;
}
export async function userExists(username: string): Promise<boolean> {
  const normalized = username.toLowerCase();
  const { count, error } = await getSupabaseClient().from("users").select("*", { count: "exact", head: true }).eq("username", normalized);

  if (error) {
    throw new Error(`Failed to check user existence: ${error.message}`);
  }
  return (count ?? 0) > 0;
}

export async function createSession(user: { id: number; username: string }, expiresAt: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const { error } = await getSupabaseClient().from("sessions").insert({
    id: sessionId,
    user_id: user.id,
    username: user.username,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
  return sessionId;
}
export async function getSession(sessionId: string): Promise<DbSession | null> {
  const { data, error } = await getSupabaseClient().from("sessions").select("*").eq("id", sessionId).gt("expires_at", Date.now()).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch session: ${error.message}`);
  }
  return {
    ...data,
    expires_at: new Date(data.expires_at).getTime(),
  } as DbSession;
}
export async function deleteSession(sessionId: string): Promise<void> {
  await getSupabaseClient().from("sessions").delete().eq("id", sessionId);
}

export async function deleteSessionsByUser(userId: number): Promise<void> {
  await getSupabaseClient().from("sessions").delete().eq("user_id", userId);
}

export async function cleanupExpiredSessions(): Promise<void> {
  await getSupabaseClient().from("sessions").delete().lt("expires_at", Date.now());
}

export async function countUsers(): Promise<number> {
  const { count, error } = await getSupabaseClient().from("users").select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count users: ${error.message}`);
  }
  return count ?? 0;
}

export type SafeUser = Omit<DbUser, "password_hash">;

export async function listUsers(): Promise<SafeUser[]> {
  const { data, error } = await getSupabaseClient().from("users").select("id, username, is_admin, created_at").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  return (data ?? []) as SafeUser[];
}

export async function deleteUser(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from("users").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export interface UpdateUserInput {
  password?: string;
  is_admin?: boolean;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<void> {
  const update: Record<string, unknown> = {};
  if (input.password !== undefined) {
    update.password_hash = await hashPassword(input.password);
  }
  if (input.is_admin !== undefined) {
    update.is_admin = input.is_admin;
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await getSupabaseClient().from("users").update(update).eq("id", id);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
