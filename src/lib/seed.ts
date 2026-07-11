import { countUsers, createUser, getUserByUsername } from "./db";

export class NoAdminUserError extends Error {
  constructor() {
    super("No users exist and AUTH_USER/AUTH_PASS are not set. Login will not work.");
  }
}

export async function seedAdminUser(): Promise<void> {
  const username = process.env.AUTH_USER;
  const password = process.env.AUTH_PASS;

  if (!username || !password) {
    const total = await countUsers();
    if (total === 0) {
      throw new NoAdminUserError();
    }
    return;
  }

  const existing = await getUserByUsername(username);
  if (existing) {
    return;
  }

  await createUser(username, password, true);
  console.log(`[auth] Seeded admin user: ${username}`);
}
