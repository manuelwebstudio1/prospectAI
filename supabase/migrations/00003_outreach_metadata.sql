alter table public.outreach_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.outreach_messages.metadata is
  'Recipient, delivery method, demo URL, sample flag and last error. Live send still requires explicit approval.';
