-- Anonymous visitors may view unofficial, unexpired demo websites by demo_id.
-- Writes remain restricted to organisation members.

drop policy if exists "public_unofficial_demo_read" on public.generated_websites;
create policy "public_unofficial_demo_read" on public.generated_websites
  for select
  using (
    is_unofficial = true
    and status in ('ready', 'expired')
    and (expires_at is null or expires_at > timezone('utc', now()) or status = 'expired')
  );

drop policy if exists "public_unofficial_demo_pages_read" on public.website_pages;
create policy "public_unofficial_demo_pages_read" on public.website_pages
  for select
  using (
    exists (
      select 1
      from public.generated_websites w
      where w.id = website_id
        and w.is_unofficial = true
        and w.status in ('ready', 'expired')
    )
  );
