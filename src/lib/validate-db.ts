import { getSupabaseClient } from "./supabase";

export async function validateDatabase(): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: usersError } = await supabase.from("users").select("id", { count: "exact", head: true });
  if (usersError) {
    throw new Error(`Database validation failed for "users" table: ${usersError.message}`);
  }

  const { error: sessionsError } = await supabase.from("sessions").select("id", { count: "exact", head: true });
  if (sessionsError) {
    throw new Error(`Database validation failed for "sessions" table: ${sessionsError.message}`);
  }
}
