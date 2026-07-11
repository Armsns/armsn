import crypto from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  const passwordHash = await hashPassword("Asxxbox12");
  const supabase = createClient(
    "https://reuujxdvrkeqjnlgsllz.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVqeGR2cmtlcWpubGdzbGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzczMjE3MCwiZXhwIjoyMDk5MzA4MTcwfQ.hrGMS7ywVfM05O1sNIEFMyz1CO72xAece3bZwJP705o",
  );

  const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("username", "armsn");
  if (error) {
    console.error("Failed to update password:", error);
    process.exit(1);
  }
  console.log("Password updated for armsn");
}

void main();
