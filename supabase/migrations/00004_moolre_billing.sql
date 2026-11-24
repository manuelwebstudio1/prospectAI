alter table public.payment_transactions
  add column if not exists external_ref text,
  add column if not exists plan_slug text,
  add column if not exists billing_interval public.billing_interval,
  add column if not exists checkout_url text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists payment_transactions_external_ref_key
  on public.payment_transactions (external_ref)
  where external_ref is not null;

alter table public.subscriptions
  add column if not exists moolre_external_ref text;

create table if not exists public.webhook_events (
  event_id text primary key,
  event text not null,
  received_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb
);

alter table public.webhook_events enable row level security;

drop policy if exists "org_insert_payments" on public.payment_transactions;
create policy "org_insert_payments" on public.payment_transactions
  for insert with check (public.is_org_member(organization_id));

drop policy if exists "org_update_payments" on public.payment_transactions;
create policy "org_update_payments" on public.payment_transactions
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "org_update_subscriptions" on public.subscriptions;
create policy "org_update_subscriptions" on public.subscriptions
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "org_insert_subscriptions" on public.subscriptions;
create policy "org_insert_subscriptions" on public.subscriptions
  for insert with check (public.is_org_member(organization_id));

drop policy if exists "org_upsert_credits" on public.credit_balances;
create policy "org_upsert_credits" on public.credit_balances
  for all using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id));

comment on table public.webhook_events is
  'Moolre event_id dedupe. Service role only; members have no policy.';

comment on column public.payment_transactions.external_ref is
  'Moolre externalref. Fulfil from webhook or Payment Status, never from the redirect URL.';
