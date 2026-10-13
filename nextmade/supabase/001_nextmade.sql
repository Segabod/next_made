-- Run once in the SQL Editor of a NEW Supabase project.
-- This does not migrate data out of the existing ChatGPT-hosted Site.
begin;
create table public.pilot_access(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.pilot_access enable row level security;
create policy own_access on public.pilot_access for select to authenticated using(user_id=auth.uid());
create function public.has_pilot_access() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.pilot_access where user_id=auth.uid()); $$;
create table public.workspaces(user_id uuid primary key references auth.users(id) on delete cascade,data jsonb not null check(octet_length(data::text)<=1000000),revision integer not null default 0 check(revision>=0),updated_at timestamptz not null default now());
create table public.ai_usage(user_id uuid primary key references auth.users(id) on delete cascade,day date not null,count integer not null check(count>=0));
create table public.circles(id uuid primary key default gen_random_uuid(),owner uuid not null references auth.users(id) on delete cascade,title text not null check(length(trim(title)) between 1 and 100),description text not null check(length(description)<=1000),code uuid not null unique default gen_random_uuid(),created timestamptz not null default now());
create table public.circle_members(circle_id uuid references public.circles(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,name text not null check(length(trim(name)) between 1 and 80),primary key(circle_id,user_id));
create table public.circle_posts(id uuid primary key default gen_random_uuid(),circle_id uuid not null references public.circles(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,name text not null,text text not null check(length(trim(text)) between 1 and 3000),created timestamptz not null default now());
create index circle_members_user on public.circle_members(user_id);
create index circle_posts_time on public.circle_posts(circle_id,created desc);
create function public.is_circle_member(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select public.has_pilot_access() and exists(select 1 from public.circle_members where circle_id=target and user_id=auth.uid()); $$;
alter table public.workspaces enable row level security;
alter table public.ai_usage enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_posts enable row level security;
create policy read_workspace on public.workspaces for select to authenticated using(user_id=auth.uid() and public.has_pilot_access());
create policy read_usage on public.ai_usage for select to authenticated using(user_id=auth.uid() and public.has_pilot_access());
create policy read_circles on public.circles for select to authenticated using(public.is_circle_member(id));
create policy delete_owned_circle on public.circles for delete to authenticated using(owner=auth.uid() and public.has_pilot_access());
create policy read_circle_members on public.circle_members for select to authenticated using(public.is_circle_member(circle_id));
create policy read_circle_posts on public.circle_posts for select to authenticated using(public.is_circle_member(circle_id));
create policy post_to_circle on public.circle_posts for insert to authenticated with check(user_id=auth.uid() and public.is_circle_member(circle_id) and name=(select m.name from public.circle_members m where m.circle_id=circle_posts.circle_id and m.user_id=auth.uid()));
-- Workspace writes are possible only through this revision-aware RPC.
create function public.save_workspace(payload jsonb,expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare result integer;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 if expected_revision<0 or octet_length(payload::text)>1000000 then raise exception 'Invalid workspace'; end if;
 if expected_revision=0 then
  insert into public.workspaces(user_id,data,revision) values(auth.uid(),payload,0) on conflict(user_id) do nothing;
 end if;
 update public.workspaces set data=payload,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=expected_revision returning revision into result;
 return result;
end; $$;
create function public.use_ai_slot() returns boolean language plpgsql security definer set search_path='' as $$
declare requests integer;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 insert into public.ai_usage(user_id,day,count) values(auth.uid(),(now() at time zone 'UTC')::date,1)
 on conflict(user_id) do update set day=excluded.day,count=case when ai_usage.day=excluded.day then ai_usage.count+1 else 1 end returning count into requests;
 return requests<=50;
end; $$;
create function public.create_circle(circle_title text,circle_description text,member_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.circle_members where user_id=auth.uid())>=10 then raise exception 'Membership limit reached'; end if;
 insert into public.circles(owner,title,description) values(auth.uid(),circle_title,circle_description) returning id into result;
 insert into public.circle_members(circle_id,user_id,name) values(result,auth.uid(),member_name);
 return result;
end; $$;
create function public.join_circle(invite_code uuid,member_name text) returns boolean language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select id into target from public.circles where code=invite_code for update;
 if target is null then raise exception 'Invite not found'; end if;
 if exists(select 1 from public.circle_members where circle_id=target and user_id=auth.uid()) then return true; end if;
 if (select count(*) from public.circle_members where circle_id=target)>=6 then raise exception 'Circle full'; end if;
 if (select count(*) from public.circle_members where user_id=auth.uid())>=10 then raise exception 'Membership limit reached'; end if;
 insert into public.circle_members(circle_id,user_id,name) values(target,auth.uid(),member_name);
 return true;
end; $$;
create function public.leave_circle(target_circle uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.is_circle_member(target_circle) then raise exception 'Not a member'; end if;
 if exists(select 1 from public.circles where id=target_circle and owner=auth.uid()) then raise exception 'Owner must delete instead'; end if;
 delete from public.circle_posts where circle_id=target_circle and user_id=auth.uid();
 delete from public.circle_members where circle_id=target_circle and user_id=auth.uid();
 return true;
end; $$;
create function public.delete_workspace() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 delete from public.circles where owner=auth.uid();
 delete from public.circle_posts where user_id=auth.uid();
 delete from public.circle_members where user_id=auth.uid();
 delete from public.workspaces where user_id=auth.uid();
 delete from public.ai_usage where user_id=auth.uid();
 return true;
end; $$;
-- Remove permissive default grants, then expose only the required reads and RPCs.
revoke all on public.pilot_access,public.workspaces,public.ai_usage,public.circles,public.circle_members,public.circle_posts from anon,authenticated;
grant select on public.pilot_access,public.workspaces,public.ai_usage,public.circles,public.circle_members,public.circle_posts to authenticated;
grant insert on public.circle_posts to authenticated;
grant delete on public.circles to authenticated;
revoke all on function public.has_pilot_access(),public.is_circle_member(uuid),public.save_workspace(jsonb,integer),public.use_ai_slot(),public.create_circle(text,text,text),public.join_circle(uuid,text),public.leave_circle(uuid),public.delete_workspace() from public,anon;
grant execute on function public.has_pilot_access(),public.is_circle_member(uuid),public.save_workspace(jsonb,integer),public.use_ai_slot(),public.create_circle(text,text,text),public.join_circle(uuid,text),public.leave_circle(uuid),public.delete_workspace() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,4000000,array['application/octet-stream']);
create policy own_evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text and public.has_pilot_access());
create policy own_evidence_upload on storage.objects for insert to authenticated with check(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text and public.has_pilot_access());
create policy own_evidence_delete on storage.objects for delete to authenticated using(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text and public.has_pilot_access());
commit;
