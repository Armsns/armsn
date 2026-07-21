import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

function createNoOpClient(): SupabaseClient {
  const noopResult = { data: null, error: null };

  function createChain(): any {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      maybeSingle: () => chain,
      single: () => chain,
      order: () => chain,
      limit: () => chain,
      lt: () => chain,
      gt: () => chain,
      then: (resolve: any, reject: any) => Promise.resolve(noopResult).then(resolve, reject),
    };
    return chain;
  }

  return {
    from: () => createChain(),
    rpc: () => Promise.resolve(noopResult),
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : createNoOpClient();

export const isSupabaseConfigured = Boolean(url && key);

export interface DbUser {
  username: string;
  password_hash: string;
  created_at: string;
}

export interface DbSession {
  id: string;
  username: string;
  expires_at: number;
}
