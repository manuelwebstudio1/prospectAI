-- Autonomous agent jobs. Reuses businesses, website_inspections, business_research,
-- generated_websites and outreach_messages. Does not duplicate those tables.

create table if not exists public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  instruction text not null,
  status public.campaign_status not null default 'queued',
  plan jsonb not null default '{}'::jsonb,
  counters jsonb not null default '{}'::jsonb,
  last_error text,
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_jobs_org_status_idx on public.agent_jobs (organization_id, status, created_at desc);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.agent_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent text not null,
  title text not null,
  sort_order integer not null default 0,
  status public.job_status not null default 'queued',
  progress integer not null default 0,
  attempts integer not null default 0,
  cursor integer not null default 0,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_tasks_job_idx on public.agent_tasks (job_id, sort_order);

create table if not exists public.agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.agent_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete set null,
  message text not null,
  level text not null default 'info',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_activity_job_idx on public.agent_activity_logs (job_id, created_at desc);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.agent_jobs(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  job_id uuid references public.agent_jobs(id) on delete set null,
  score integer not null check (score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, business_id, job_id)
);

create table if not exists public.deployment_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.generated_websites(id) on delete cascade,
  job_id uuid references public.agent_jobs(id) on delete set null,
  demo_id text not null,
  preview_path text not null,
  status text not null default 'queued',
  verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, demo_id)
);

create table if not exists public.agent_usage_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.agent_jobs(id) on delete set null,
  credit_type public.credit_type not null,
  amount integer not null default 1,
  provider text,
  provider_input_tokens integer,
  provider_output_tokens integer,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.agent_jobs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_activity_logs enable row level security;
alter table public.agent_memory enable row level security;
alter table public.opportunity_scores enable row level security;
alter table public.deployment_records enable row level security;
alter table public.agent_usage_records enable row level security;

drop policy if exists "agent_jobs_org" on public.agent_jobs;
create policy "agent_jobs_org" on public.agent_jobs
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "agent_tasks_org" on public.agent_tasks;
create policy "agent_tasks_org" on public.agent_tasks
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "agent_activity_org" on public.agent_activity_logs;
create policy "agent_activity_org" on public.agent_activity_logs
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "agent_memory_org" on public.agent_memory;
create policy "agent_memory_org" on public.agent_memory
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "opportunity_scores_org" on public.opportunity_scores;
create policy "opportunity_scores_org" on public.opportunity_scores
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "deployment_records_org" on public.deployment_records;
create policy "deployment_records_org" on public.deployment_records
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "agent_usage_org" on public.agent_usage_records;
create policy "agent_usage_org" on public.agent_usage_records
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());
