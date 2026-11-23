-- NextStep Study private feedback database. Run in your own Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.nextstep_feedback_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.nextstep_feedback_admins enable row level security;
revoke all on public.nextstep_feedback_admins from anon,authenticated;
grant select on public.nextstep_feedback_admins to authenticated;
drop policy if exists nextstep_admin_self on public.nextstep_feedback_admins;
create policy nextstep_admin_self on public.nextstep_feedback_admins
 for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.nextstep_feedback (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 category text not null check (category in ('Suggestion','Bug report','Question','Content correction','Other')),
 jlpt_level text not null check (jlpt_level in ('General','N1','N2','N3','N4','N5')),
 rating smallint check (rating between 1 and 5),
 display_name text check (char_length(display_name) <= 70),
 content text not null check (char_length(content) between 12 and 1800),
 source_url text not null check (char_length(source_url) <= 900),
 question_id text check (char_length(question_id) <= 180),
 status text not null default 'new' check (status in ('new','reviewed','resolved'))
);
create index if not exists nextstep_feedback_created_at on public.nextstep_feedback(created_at desc);
alter table public.nextstep_feedback enable row level security;
revoke all on public.nextstep_feedback from anon,authenticated;
grant select on public.nextstep_feedback to authenticated;
drop policy if exists nextstep_admin_read on public.nextstep_feedback;
create policy nextstep_admin_read on public.nextstep_feedback
 for select to authenticated
 using (exists(select 1 from public.nextstep_feedback_admins a where a.user_id=(select auth.uid())));

create table if not exists public.nextstep_feedback_rate_limits (
 bucket_hash text primary key,
 hits integer not null,
 expires_at timestamptz not null
);
alter table public.nextstep_feedback_rate_limits enable row level security;
revoke all on public.nextstep_feedback_rate_limits from anon,authenticated;

create or replace function public.nextstep_submit_feedback(
 p_category text,p_level text,p_rating integer,p_name text,
 p_content text,p_source_url text,p_question_id text,p_bucket_hash text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare hits_now integer; new_id uuid;
begin
 if p_category is null or p_category not in ('Suggestion','Bug report','Question','Content correction','Other')
 or p_level is null or p_level not in ('General','N1','N2','N3','N4','N5')
 or (p_rating is not null and (p_rating < 1 or p_rating > 5))
 or p_content is null or char_length(p_content) not between 12 and 1800
 or p_source_url is null or char_length(p_source_url)>900
 or char_length(coalesce(p_name,''))>70 or char_length(coalesce(p_question_id,''))>180
 or p_bucket_hash is null or char_length(p_bucket_hash)<>64
 then raise exception 'INVALID_FEEDBACK'; end if;
 insert into public.nextstep_feedback_rate_limits(bucket_hash,hits,expires_at)
 values(p_bucket_hash,1,date_trunc('hour',now())+interval '1 hour')
 on conflict(bucket_hash) do update set
  hits=case when public.nextstep_feedback_rate_limits.expires_at<=now() then 1 else public.nextstep_feedback_rate_limits.hits+1 end,
  expires_at=excluded.expires_at
 returning hits into hits_now;
 if hits_now>5 then raise exception 'RATE_LIMIT_EXCEEDED'; end if;
 insert into public.nextstep_feedback(category,jlpt_level,rating,display_name,content,source_url,question_id)
 values(p_category,p_level,p_rating,nullif(p_name,''),p_content,p_source_url,nullif(p_question_id,''))
 returning id into new_id;
 return new_id;
end
$$;
revoke all on function public.nextstep_submit_feedback(text,text,integer,text,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.nextstep_submit_feedback(text,text,integer,text,text,text,text,text)
 to service_role;

-- Administrator setup, executed separately with the actual authenticated user UUID:
-- insert into public.nextstep_feedback_admins(user_id) values ('ACTUAL_AUTH_USER_UUID');
-- Optional maintenance: delete from public.nextstep_feedback_rate_limits
--   where expires_at < now() - interval '7 days';
