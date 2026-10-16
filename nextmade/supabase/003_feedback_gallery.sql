-- Run once in the Supabase SQL Editor after 001 and 002.
-- Adds member feedback (write-only for members) and the Build Gallery (shared showcase).
begin;
create table public.feedback(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('win','love','feature','problem','reply')),
  text text not null check(length(trim(text)) between 1 and 3000),
  page text not null default '' check(length(page)<=60),
  created timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy send_feedback on public.feedback for insert to authenticated with check(user_id=auth.uid() and public.has_pilot_access());

create table public.showcase(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 80),
  title text not null check(length(trim(title)) between 1 and 120),
  description text not null check(length(description)<=1000),
  url text not null check(url ~ '^https://' and length(url)<=500),
  created timestamptz not null default now()
);
create index showcase_time on public.showcase(created desc);
alter table public.showcase enable row level security;
create policy read_showcase on public.showcase for select to authenticated using(public.has_pilot_access());
create policy add_showcase on public.showcase for insert to authenticated with check(user_id=auth.uid() and public.has_pilot_access() and (select count(*) from public.showcase s where s.user_id=auth.uid())<10);
create policy remove_showcase on public.showcase for delete to authenticated using(user_id=auth.uid());

revoke all on public.feedback,public.showcase from anon,authenticated;
grant insert on public.feedback to authenticated;
grant select,insert,delete on public.showcase to authenticated;

-- Account deletion also removes these rows.
create or replace function public.delete_workspace() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 delete from public.circles where owner=auth.uid();
 delete from public.circle_posts where user_id=auth.uid();
 delete from public.circle_members where user_id=auth.uid();
 delete from public.workspaces where user_id=auth.uid();
 delete from public.ai_usage where user_id=auth.uid();
 delete from public.feedback where user_id=auth.uid();
 delete from public.showcase where user_id=auth.uid();
 return true;
end; $$;
commit;
