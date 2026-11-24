-- Write policies required by the Next.js backend (server actions + API routes).
-- Also tightens helper functions after the initial schema apply.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop policy if exists "org_insert_ai_usage" on public.ai_usage_logs;
create policy "org_insert_ai_usage" on public.ai_usage_logs
  for insert with check (public.is_org_member(organization_id) or public.is_platform_admin());

drop policy if exists "org_insert_outreach_events" on public.outreach_events;
create policy "org_insert_outreach_events" on public.outreach_events
  for insert with check (
    exists (
      select 1 from public.outreach_messages m
      where m.id = message_id and public.is_org_member(m.organization_id)
    )
  );

drop policy if exists "org_insert_business_sources" on public.business_sources;
create policy "org_insert_business_sources" on public.business_sources
  for insert with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    )
  );

revoke execute on function public.handle_new_user() from anon, public;
revoke execute on function public.is_org_member(uuid) from anon, public;
revoke execute on function public.is_platform_admin() from anon, public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
