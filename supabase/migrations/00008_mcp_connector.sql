-- Grok Bot / custom connector OAuth and MCP audit. Independent of any xAI API key.

create table if not exists public.mcp_oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_secret_hash text,
  client_name text not null default 'Custom connector',
  redirect_uris jsonb not null default '[]'::jsonb,
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mcp_oauth_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mcp_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope text not null default 'mcp',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mcp_tool_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  client_id text,
  tool_name text not null,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mcp_connection_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  client_id text,
  client_name text,
  detail text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists mcp_tool_logs_created_idx on public.mcp_tool_logs (created_at desc);
create index if not exists mcp_connection_events_created_idx on public.mcp_connection_events (created_at desc);

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;
alter table public.mcp_oauth_tokens enable row level security;
alter table public.mcp_tool_logs enable row level security;
alter table public.mcp_connection_events enable row level security;

-- Connector tables are server-managed. Members can read their own tool logs.
drop policy if exists "mcp_tool_logs_org_read" on public.mcp_tool_logs;
create policy "mcp_tool_logs_org_read" on public.mcp_tool_logs
  for select using (organization_id is not null and public.is_org_member(organization_id));

drop policy if exists "mcp_connection_admin_read" on public.mcp_connection_events;
create policy "mcp_connection_admin_read" on public.mcp_connection_events
  for select using (public.is_platform_admin());
