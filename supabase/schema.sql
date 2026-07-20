-- Run this SQL in the Supabase SQL Editor

-- Users table (replaces data/users.json)
create table if not exists public.users (
  username text primary key,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Sessions table (replaces in-memory sessions Map)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  expires_at bigint not null
);

-- Analytics events table
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  path text,
  user_agent text,
  ip_hash text,
  username text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_analytics_event_type on public.analytics(event_type);
create index if not exists idx_analytics_created_at on public.analytics(created_at desc);
create index if not exists idx_analytics_username on public.analytics(username);

-- Analytics aggregation helpers functions
-- Returns the number of unique ip_hash values for page_view events in a time range.
create or replace function public.get_unique_visitor_count(start_time timestamptz, end_time timestamptz)
returns bigint
language sql
stable
as $$
  select count(distinct ip_hash)
  from public.analytics
  where event_type = 'page_view'
    and ip_hash is not null
    and created_at >= start_time
    and created_at < end_time;
$$;

-- Returns the most viewed paths for page_view events within an optional date range.
create or replace function public.get_top_pages(page_limit int, start_time timestamptz default '1970-01-01T00:00:00Z'::timestamptz, end_time timestamptz default '9999-12-31T23:59:59Z'::timestamptz)
returns table(path text, count bigint)
language sql
stable
as $$
  select a.path, count(*)::bigint as count
  from public.analytics a
  where a.event_type = 'page_view'
    and a.path is not null
    and a.created_at >= start_time
    and a.created_at < end_time
  group by a.path
  order by count desc
  limit page_limit;
$$;

-- Returns daily event counts for a given event type over a date range.
create or replace function public.get_daily_event_counts(start_time timestamptz, end_time timestamptz, event_type_filter text)
returns table(day text, count bigint)
language sql
stable
as $$
  select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::bigint as count
  from public.analytics
  where event_type = event_type_filter
    and created_at >= start_time
    and created_at < end_time
  group by day
  order by day asc;
$$;

-- Enable RLS (optional but recommended; service_role bypasses RLS)
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.analytics enable row level security;
