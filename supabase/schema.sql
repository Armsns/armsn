-- Run this SQL in the Supabase SQL Editor

-- Users table (replaces data/users.json)
create table if not exists public.users (
  username text primary key,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Chat messages table (replaces in-memory chatMessages array)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  "user" text not null,
  text text not null,
  time timestamptz default now()
);

-- Sessions table (replaces in-memory sessions Map)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  expires_at bigint not null
);

-- Enable RLS (optional but recommended; service_role bypasses RLS)
alter table public.users enable row level security;
alter table public.chat_messages enable row level security;
alter table public.sessions enable row level security;
