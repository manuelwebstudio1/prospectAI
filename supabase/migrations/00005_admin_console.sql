alter table public.profiles
  add column if not exists suspended_at timestamptz;

drop policy if exists "settings_admin_only" on public.system_settings;
create policy "settings_admin_select" on public.system_settings
  for select using (public.is_platform_admin());
create policy "settings_admin_write" on public.system_settings
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "plans_admin_write" on public.subscription_plans;
create policy "plans_admin_write" on public.subscription_plans
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "activity_admin_write" on public.activity_logs;
create policy "activity_admin_write" on public.activity_logs
  for insert with check (public.is_platform_admin());

drop policy if exists "activity_admin_select" on public.activity_logs;
create policy "activity_admin_select" on public.activity_logs
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

comment on column public.profiles.suspended_at is
  'When set, the workspace dashboard is blocked. Platform admins can still open /admin.';
