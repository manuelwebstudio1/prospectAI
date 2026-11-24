-- ProspectAI initial schema
-- Apply in the Supabase SQL editor or via the Supabase CLI.
-- This migration is additive and safe to run once on a fresh project.

create extension if not exists "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────────────────────

do $$ begin
  create type public.organization_role as enum ('owner', 'admin', 'member', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.platform_role as enum ('user', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_interval as enum ('monthly', 'annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.campaign_status as enum ('draft', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.website_status as enum ('no_website', 'poor_website', 'good_website', 'unverified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_stage as enum (
    'new_lead', 'researched', 'demo_generated', 'ready_to_contact',
    'contacted', 'interested', 'negotiation', 'converted', 'not_interested'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_type as enum ('discovery', 'research', 'website_generation', 'outreach');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'retrying');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.outreach_channel as enum ('email', 'whatsapp', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.outreach_status as enum ('draft', 'approved', 'scheduled', 'sent', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.generated_website_status as enum ('queued', 'generating', 'ready', 'failed', 'expired', 'published');
exception when duplicate_object then null; end $$;

-- ── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.platform_role in ('admin', 'super_admin')
  );
$$;

-- ── Core tenancy ───────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text,
  business_type text,
  primary_industry text,
  intended_use text,
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text,
  email text,
  avatar_url text,
  country text,
  onboarding_completed boolean not null default false,
  platform_role public.platform_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'member',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

-- ── Subscriptions & credits ────────────────────────────────────────────────

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_monthly_ghs numeric(12,2) not null,
  price_annual_ghs numeric(12,2) not null,
  discovery_credits integer not null,
  research_credits integer not null,
  website_generation_credits integer not null,
  outreach_credits integer not null,
  max_team_members integer not null default 1,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'trialing',
  billing_interval public.billing_interval not null default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  paystack_subscription_code text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.credit_balances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  credit_type public.credit_type not null,
  remaining integer not null default 0,
  allocated integer not null default 0,
  unique (organization_id, credit_type)
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  credit_type public.credit_type not null,
  amount integer not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_transactions_org_idx on public.credit_transactions (organization_id, created_at desc);

-- ── Campaigns & discovery ──────────────────────────────────────────────────

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  country text not null default 'GH',
  region text,
  city text,
  industry text,
  custom_category text,
  discovery_limit integer not null default 50,
  website_status_filter text not null default 'no_website',
  ai_research_enabled boolean not null default true,
  website_generation_enabled boolean not null default false,
  outreach_enabled boolean not null default false,
  status public.campaign_status not null default 'draft',
  progress jsonb not null default '{"discovered":0,"processed":0,"no_website":0,"has_website":0,"poor_website":0,"failed":0}'::jsonb,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists campaigns_org_status_idx on public.campaigns (organization_id, status);

create table if not exists public.campaign_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_type text not null,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  name text not null,
  normalized_name text generated always as (lower(regexp_replace(name, '\s+', ' ', 'g'))) stored,
  industry text,
  category text,
  country text,
  region text,
  city text,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website_url text,
  website_status public.website_status not null default 'unverified',
  source text,
  external_place_id text,
  is_sample boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists businesses_org_place_unique
  on public.businesses (organization_id, external_place_id)
  where external_place_id is not null;

create unique index if not exists businesses_org_name_city_unique
  on public.businesses (organization_id, normalized_name, (coalesce(city, '')));

create index if not exists businesses_org_status_idx on public.businesses (organization_id, website_status);
create index if not exists businesses_org_created_idx on public.businesses (organization_id, created_at desc);

create table if not exists public.business_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_name text not null,
  source_id text,
  raw_payload jsonb,
  fetched_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.website_inspections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text,
  verification_status public.website_status not null default 'unverified',
  http_status integer,
  is_reachable boolean,
  redirect_url text,
  mobile_score numeric(5,2),
  performance_score numeric(5,2),
  seo_score numeric(5,2),
  evidence jsonb not null default '{}'::jsonb,
  evidence_source text,
  confidence numeric(5,2),
  inspected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_research (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  summary text,
  services jsonb not null default '[]'::jsonb,
  products jsonb not null default '[]'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  website_recommendation jsonb,
  unknowns jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ── Demos, leads, outreach ─────────────────────────────────────────────────

create table if not exists public.generated_websites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  demo_id text not null unique,
  template_key text,
  status public.generated_website_status not null default 'queued',
  preview_url text,
  design jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  is_unofficial boolean not null default true,
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.generated_websites(id) on delete cascade,
  slug text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  unique (website_id, slug)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  stage public.lead_stage not null default 'new_lead',
  owner_id uuid references public.profiles(id) on delete set null,
  tags text[] not null default '{}',
  last_interaction_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_org_stage_idx on public.leads (organization_id, stage);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel public.outreach_channel not null default 'email',
  subject text,
  body text not null,
  status public.outreach_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.outreach_messages(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ── Platform tables ────────────────────────────────────────────────────────

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_logs_org_idx on public.activity_logs (organization_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, provider)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  provider_reference text unique,
  amount numeric(12,2) not null,
  currency text not null default 'GHS',
  status text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  agent text not null,
  provider text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_estimate numeric(12,6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- ── updated_at triggers ────────────────────────────────────────────────────

do $$ declare
  t text;
begin
  foreach t in array array[
    'organizations','profiles','subscription_plans','subscriptions','campaigns',
    'businesses','generated_websites','leads','outreach_messages','integrations'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ── Auth profile bootstrap ─────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed plans ─────────────────────────────────────────────────────────────

insert into public.subscription_plans (
  slug, name, price_monthly_ghs, price_annual_ghs,
  discovery_credits, research_credits, website_generation_credits, outreach_credits,
  max_team_members, features
) values
  (
    'starter', 'Starter', 150, 1500,
    250, 100, 10, 50, 1,
    '["Limited business discoveries","Website detection","AI business research","Limited demo generation","Basic lead management"]'::jsonb
  ),
  (
    'professional', 'Professional', 350, 3500,
    10000, 2000, -1, 1000, 5,
    '["Increased discovery limits","Unlimited demo generation","Advanced AI research","AI outreach assistance","Campaign management","Analytics"]'::jsonb
  ),
  (
    'agency', 'Agency', 700, 7000,
    40000, 8000, -1, 5000, 25,
    '["Higher usage limits","Team collaboration","Advanced analytics","Priority processing","Increased AI usage"]'::jsonb
  )
on conflict (slug) do update set
  price_monthly_ghs = excluded.price_monthly_ghs,
  price_annual_ghs = excluded.price_annual_ghs,
  discovery_credits = excluded.discovery_credits,
  research_credits = excluded.research_credits,
  website_generation_credits = excluded.website_generation_credits,
  outreach_credits = excluded.outreach_credits,
  max_team_members = excluded.max_team_members,
  features = excluded.features,
  updated_at = timezone('utc', now());

insert into public.system_settings (key, value)
values
  ('trial_days', '14'::jsonb),
  ('default_plan', '"starter"'::jsonb)
on conflict (key) do nothing;

-- ── Row Level Security ─────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_jobs enable row level security;
alter table public.businesses enable row level security;
alter table public.business_sources enable row level security;
alter table public.website_inspections enable row level security;
alter table public.business_research enable row level security;
alter table public.generated_websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_events enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.integrations enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.system_settings enable row level security;

-- Profiles
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin() or (
    organization_id is not null and public.is_org_member(organization_id)
  ));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Organizations
drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select" on public.organizations
  for select using (public.is_org_member(id) or public.is_platform_admin());

drop policy if exists "organizations_member_update" on public.organizations;
create policy "organizations_member_update" on public.organizations
  for update using (public.is_org_member(id));

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated" on public.organizations
  for insert with check (auth.uid() is not null);

-- Members
drop policy if exists "members_select" on public.organization_members;
create policy "members_select" on public.organization_members
  for select using (public.is_org_member(organization_id) or user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "members_insert" on public.organization_members;
create policy "members_insert" on public.organization_members
  for insert with check (user_id = auth.uid() or public.is_org_member(organization_id));

-- Plans are readable by authenticated users
drop policy if exists "plans_public_read" on public.subscription_plans;
create policy "plans_public_read" on public.subscription_plans
  for select using (auth.uid() is not null or is_active = true);

-- Generic org-scoped policy helper applied to remaining tables
drop policy if exists "org_select_subscriptions" on public.subscriptions;
create policy "org_select_subscriptions" on public.subscriptions
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "org_select_credits" on public.credit_balances;
create policy "org_select_credits" on public.credit_balances
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "org_select_credit_tx" on public.credit_transactions;
create policy "org_select_credit_tx" on public.credit_transactions
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "org_all_campaigns" on public.campaigns;
create policy "org_all_campaigns" on public.campaigns
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_campaign_jobs" on public.campaign_jobs;
create policy "org_all_campaign_jobs" on public.campaign_jobs
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_businesses" on public.businesses;
create policy "org_all_businesses" on public.businesses
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_select_business_sources" on public.business_sources;
create policy "org_select_business_sources" on public.business_sources
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    ) or public.is_platform_admin()
  );

drop policy if exists "org_all_inspections" on public.website_inspections;
create policy "org_all_inspections" on public.website_inspections
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_research" on public.business_research;
create policy "org_all_research" on public.business_research
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_websites" on public.generated_websites;
create policy "org_all_websites" on public.generated_websites
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_select_pages" on public.website_pages;
create policy "org_select_pages" on public.website_pages
  for all using (
    exists (
      select 1 from public.generated_websites w
      where w.id = website_id and public.is_org_member(w.organization_id)
    ) or public.is_platform_admin()
  );

drop policy if exists "org_all_leads" on public.leads;
create policy "org_all_leads" on public.leads
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_lead_notes" on public.lead_notes;
create policy "org_all_lead_notes" on public.lead_notes
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_all_outreach" on public.outreach_messages;
create policy "org_all_outreach" on public.outreach_messages
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_select_outreach_events" on public.outreach_events;
create policy "org_select_outreach_events" on public.outreach_events
  for select using (
    exists (
      select 1 from public.outreach_messages m
      where m.id = message_id and public.is_org_member(m.organization_id)
    ) or public.is_platform_admin()
  );

drop policy if exists "org_select_activity" on public.activity_logs;
create policy "org_select_activity" on public.activity_logs
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "notifications_self" on public.notifications;
create policy "notifications_self" on public.notifications
  for all using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid());

drop policy if exists "org_all_integrations" on public.integrations;
create policy "org_all_integrations" on public.integrations
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

drop policy if exists "org_select_payments" on public.payment_transactions;
create policy "org_select_payments" on public.payment_transactions
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "org_select_ai_usage" on public.ai_usage_logs;
create policy "org_select_ai_usage" on public.ai_usage_logs
  for select using (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "settings_admin_only" on public.system_settings;
create policy "settings_admin_only" on public.system_settings
  for select using (auth.uid() is not null);
