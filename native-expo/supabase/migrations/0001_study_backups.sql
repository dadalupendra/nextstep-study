-- Run in your own Supabase project before enabling EXPO_PUBLIC_* configuration.
-- All cloud backups are owned by the signed-in user, enforced by PostgreSQL RLS.
create table if not exists public.study_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint json_object_payload check (jsonb_typeof(payload) = 'object'),
  constraint size_limit check (octet_length(payload::text) < 500000)
);
alter table public.study_backups enable row level security;
revoke all on public.study_backups from anon;
grant select, insert, update, delete on public.study_backups to authenticated;
drop policy if exists study_backup_select_self on public.study_backups;
create policy study_backup_select_self on public.study_backups for select
  to authenticated using ((select auth.uid()) = user_id);
drop policy if exists study_backup_insert_self on public.study_backups;
create policy study_backup_insert_self on public.study_backups for insert
  to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists study_backup_update_self on public.study_backups;
create policy study_backup_update_self on public.study_backups for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists study_backup_delete_self on public.study_backups;
create policy study_backup_delete_self on public.study_backups for delete
  to authenticated using ((select auth.uid()) = user_id);

-- Configure Supabase Auth outside SQL:
-- Require email confirmations and secure password strength.
-- Set login/signup/OTP rate limits and CAPTCHA.
-- Enable TOTP multi-factor authentication and monitor abuse.
-- Do not permit under-18 signup until a verified parental consent flow exists.
-- Audit this schema and authentication policies before real public launch.
