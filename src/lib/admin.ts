export interface AdminSession {
  user: string;
  isAdmin: boolean;
}

export interface UserListResponse {
  users: string[];
}

export interface AdminActionResponse {
  success?: boolean;
  username?: string;
  error?: string;
}

export async function getSession(): Promise<AdminSession | null> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  return (await res.json()) as AdminSession;
}

export async function getUsers(): Promise<string[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) {
    const data = (await res.json().catch(() => ({ error: "Failed to load users" }))) as { error?: string };
    throw new Error(data.error || "Failed to load users");
  }
  const data = (await res.json()) as UserListResponse;
  return data.users || [];
}

export async function createUser(username: string, password: string): Promise<AdminActionResponse> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json().catch(() => ({ error: "Failed to create user" }))) as AdminActionResponse;
  if (!res.ok) {
    throw new Error(data.error || "Failed to create user");
  }
  return data;
}

export async function deleteUser(username: string): Promise<AdminActionResponse> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, { method: "DELETE" });
  const data = (await res.json().catch(() => ({ error: "Failed to delete user" }))) as AdminActionResponse;
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete user");
  }
  return data;
}

export async function resetUserPassword(username: string, password: string): Promise<AdminActionResponse> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = (await res.json().catch(() => ({ error: "Failed to reset password" }))) as AdminActionResponse;
  if (!res.ok) {
    throw new Error(data.error || "Failed to reset password");
  }
  return data;
}
