create table if not exists public.mcp_idempotency (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tool_name text not null,
  key_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, tool_name, key_hash)
);

create index if not exists mcp_idempotency_created_idx on public.mcp_idempotency (created_at desc);

alter table public.mcp_idempotency enable row level security;

drop policy if exists "mcp_idempotency_org_read" on public.mcp_idempotency;
create policy "mcp_idempotency_org_read" on public.mcp_idempotency
  for select using (public.is_org_member(organization_id));
