import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
}

export const supabase: SupabaseClient = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface DbUser {
  username: string;
  password_hash: string;
  created_at: string;
}

export interface DbChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface DbSession {
  id: string;
  username: string;
  expires_at: number;
}
