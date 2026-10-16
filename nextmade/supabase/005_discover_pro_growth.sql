-- NextMade 005: Browse catalog, Pro plan and limits, Connect your AI keys, offer pages, office hours.
-- Run once in the Supabase SQL Editor AFTER 001-004.
-- Grant Pro by hand until billing goes live, for example:
--   insert into public.plans(user_id,tier,note) select id,'pro','founding member' from auth.users where email='you@example.com'
--   on conflict(user_id) do update set tier='pro',note=excluded.note,until=null;
begin;

/* ---------- Plans ---------- */
create table public.plans(
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check(tier in ('free','pro')),
  note text not null default '' check(length(note)<=200),
  until timestamptz,
  created timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy own_plan on public.plans for select to authenticated using(user_id=auth.uid());

create table public.upgrade_requests(
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check(length(name)<=80),
  reason text not null default '' check(length(reason)<=1000),
  created timestamptz not null default now()
);
alter table public.upgrade_requests enable row level security;
create policy own_upgrade_read on public.upgrade_requests for select to authenticated using(user_id=auth.uid());
create policy own_upgrade_add on public.upgrade_requests for insert to authenticated with check(user_id=auth.uid() and public.has_pilot_access());

-- Internal: the tier of any user. Not exposed to members directly.
create function public.plan_of(target uuid) returns text language sql stable security definer set search_path='' as $$
  select coalesce((select p.tier from public.plans p where p.user_id=target and (p.until is null or p.until>now())),'free');
$$;
create function public.my_plan() returns text language sql stable security definer set search_path='' as $$ select public.plan_of(auth.uid()); $$;

-- Daily Nova limit now depends on the plan: Free 25, Pro 150.
create or replace function public.use_ai_slot() returns boolean language plpgsql security definer set search_path='' as $$
declare requests integer;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 insert into public.ai_usage(user_id,day,count) values(auth.uid(),(now() at time zone 'UTC')::date,1)
 on conflict(user_id) do update set day=excluded.day,count=case when ai_usage.day=excluded.day then ai_usage.count+1 else 1 end returning count into requests;
 return requests<=(case when public.plan_of(auth.uid())='pro' then 150 else 25 end);
end; $$;

/* ---------- Browse catalog (ideas, trends, niches) ---------- */
create table public.catalog(
  id uuid primary key default gen_random_uuid(),
  kind text not null check(kind in ('idea','trend','niche')),
  title text not null check(length(trim(title)) between 1 and 200),
  summary text not null default '' check(length(summary)<=2000),
  market text not null default '' check(length(market)<=20),
  category text not null default '' check(length(category)<=40),
  tags text[] not null default '{}' check(cardinality(tags)<=10),
  scores jsonb not null default '{}' check(octet_length(scores::text)<=1000),
  demand jsonb not null default '{}' check(octet_length(demand::text)<=1000),
  body jsonb not null default '{}' check(octet_length(body::text)<=60000),
  sources jsonb not null default '[]' check(octet_length(sources::text)<=20000),
  canada boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  shared boolean not null default false,
  created timestamptz not null default now()
);
create index catalog_time on public.catalog(kind,created desc);
create index catalog_owner on public.catalog(created_by,created desc);
alter table public.catalog enable row level security;
-- NextMade entries (created_by is null), shared community research, and your own research are visible.
create policy read_catalog on public.catalog for select to authenticated using(public.has_pilot_access() and (created_by is null or shared or created_by=auth.uid()));
create policy delete_own_catalog on public.catalog for delete to authenticated using(created_by=auth.uid());

-- Full reports (body, sources) come only through catalog_entry, which applies the plan rules:
-- Free members open entries from the last 7 days and their own; Pro opens the whole archive.
create function public.catalog_entry(entry_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.catalog; locked boolean;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 select * into r from public.catalog c where c.id=entry_id and (c.created_by is null or c.shared or c.created_by=auth.uid());
 if r.id is null then return null; end if;
 locked := public.plan_of(auth.uid())<>'pro' and r.created < now()-interval '7 days' and r.created_by is distinct from auth.uid();
 return jsonb_build_object('id',r.id,'kind',r.kind,'title',r.title,'summary',r.summary,'market',r.market,'category',r.category,'tags',to_jsonb(r.tags),
   'scores',r.scores,'demand',r.demand,'canada',r.canada,'created',r.created,'shared',r.shared,'mine',r.created_by=auth.uid(),'community',r.created_by is not null,
   'locked',locked,'body',case when locked then '{}'::jsonb else r.body end,'sources',case when locked then '[]'::jsonb else r.sources end);
end; $$;

-- Members add researched entries through this RPC. Free: 1 per 30 days. Pro: 60 per 30 days.
create function public.add_catalog_entry(entry jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare used integer; result uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended('catalog'||auth.uid()::text,0));
 select count(*) into used from public.catalog where created_by=auth.uid() and created>now()-interval '30 days';
 if used >= (case when public.plan_of(auth.uid())='pro' then 60 else 1 end) then raise exception 'Research limit reached'; end if;
 insert into public.catalog(kind,title,summary,market,category,tags,scores,demand,body,sources,canada,created_by,shared)
 values(entry->>'kind',left(entry->>'title',200),left(coalesce(entry->>'summary',''),2000),left(coalesce(entry->>'market',''),20),left(coalesce(entry->>'category',''),40),
   coalesce((select array_agg(left(t,40)) from (select jsonb_array_elements_text(coalesce(entry->'tags','[]')) t limit 10) x),'{}'),
   coalesce(entry->'scores','{}'),coalesce(entry->'demand','{}'),coalesce(entry->'body','{}'),coalesce(entry->'sources','[]'),
   coalesce((entry->>'canada')::boolean,false),auth.uid(),coalesce((entry->>'shared')::boolean,false))
 returning id into result;
 return result;
end; $$;
create function public.share_catalog_entry(entry_id uuid,share boolean) returns boolean language sql security definer set search_path='' as $$
  update public.catalog set shared=share where id=entry_id and created_by=auth.uid() returning true;
$$;
create function public.research_used() returns integer language sql stable security definer set search_path='' as $$
  select count(*)::integer from public.catalog where created_by=auth.uid() and created>now()-interval '30 days';
$$;

/* ---------- Connect your AI (personal MCP keys, Pro) ---------- */
create table public.api_keys(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 60),
  key_hash text not null unique check(key_hash ~ '^[0-9a-f]{64}$'),
  prefix text not null check(length(prefix)<=16),
  created timestamptz not null default now(),
  last_used timestamptz
);
alter table public.api_keys enable row level security;
create policy own_keys on public.api_keys for select to authenticated using(user_id=auth.uid());
create policy delete_own_keys on public.api_keys for delete to authenticated using(user_id=auth.uid());
create function public.create_api_key(key_name text,new_hash text,new_prefix text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 if public.plan_of(auth.uid())<>'pro' then raise exception 'Pro required'; end if;
 if (select count(*) from public.api_keys where user_id=auth.uid())>=5 then raise exception 'Key limit reached'; end if;
 insert into public.api_keys(user_id,name,key_hash,prefix) values(auth.uid(),key_name,new_hash,new_prefix) returning id into result;
 return result;
end; $$;
-- Resolve a key to its member. Only valid for Pro members who still have workspace access.
create function public.mcp_user(k text) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid;
begin
 select a.user_id into u from public.api_keys a where a.key_hash=k;
 if u is null or not exists(select 1 from public.pilot_access p where p.user_id=u) or public.plan_of(u)<>'pro' then return null; end if;
 update public.api_keys set last_used=now() where key_hash=k and (last_used is null or last_used<now()-interval '5 minutes');
 return u;
end; $$;
create function public.mcp_workspace(k text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; w record;
begin
 u := public.mcp_user(k);
 if u is null then return null; end if;
 select data,revision into w from public.workspaces where user_id=u;
 return jsonb_build_object('data',coalesce(w.data,'{}'::jsonb),'revision',coalesce(w.revision,-1));
end; $$;
create function public.mcp_save_workspace(k text,payload jsonb,expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid; result integer;
begin
 u := public.mcp_user(k);
 if u is null then raise exception 'Access denied'; end if;
 if octet_length(payload::text)>1000000 then raise exception 'Invalid workspace'; end if;
 update public.workspaces set data=payload,revision=revision+1,updated_at=now() where user_id=u and revision=expected_revision returning revision into result;
 return result;
end; $$;
create function public.mcp_catalog(k text,want_kind text,q text,lim integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;
begin
 u := public.mcp_user(k);
 if u is null then return null; end if;
 return coalesce((select jsonb_agg(x) from (
   select c.id,c.kind,c.title,c.summary,c.market,c.category,c.tags,c.scores,c.demand,c.canada,c.created from public.catalog c
   where (c.created_by is null or c.shared or c.created_by=u) and (want_kind is null or want_kind='' or c.kind=want_kind)
     and (q is null or q='' or c.title ilike '%'||q||'%' or c.summary ilike '%'||q||'%' or array_to_string(c.tags,' ') ilike '%'||q||'%')
   order by c.created desc limit least(greatest(coalesce(lim,10),1),25)) x),'[]'::jsonb);
end; $$;
create function public.mcp_catalog_entry(k text,entry_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;
begin
 u := public.mcp_user(k);
 if u is null then return null; end if;
 return (select to_jsonb(x) from (select c.id,c.kind,c.title,c.summary,c.market,c.category,c.tags,c.scores,c.demand,c.body,c.sources,c.canada,c.created
   from public.catalog c where c.id=entry_id and (c.created_by is null or c.shared or c.created_by=u)) x);
end; $$;

/* ---------- Offer pages (public smoke tests) ---------- */
create table public.offer_pages(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  offer_ref text not null default '' check(length(offer_ref)<=100),
  headline text not null check(length(trim(headline)) between 1 and 120),
  subhead text not null default '' check(length(subhead)<=400),
  bullets jsonb not null default '[]' check(jsonb_typeof(bullets)='array' and jsonb_array_length(bullets)<=6 and octet_length(bullets::text)<=2000),
  price text not null default '' check(length(price)<=80),
  cta text not null default 'Join the waitlist' check(length(trim(cta)) between 1 and 40),
  question text not null default '' check(length(question)<=200),
  founder_name text not null default '' check(length(founder_name)<=80),
  published boolean not null default false,
  blocked boolean not null default false,
  views integer not null default 0,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);
create index offer_pages_owner on public.offer_pages(user_id);
create table public.offer_signups(
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.offer_pages(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 120),
  email text not null check(length(email)<=254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  answer text not null default '' check(length(answer)<=1000),
  imported boolean not null default false,
  created timestamptz not null default now()
);
create unique index offer_signups_once on public.offer_signups(page_id,lower(email));
alter table public.offer_pages enable row level security;
alter table public.offer_signups enable row level security;
create policy own_pages on public.offer_pages for select to authenticated using(user_id=auth.uid());
create policy delete_own_pages on public.offer_pages for delete to authenticated using(user_id=auth.uid());
create policy own_signups on public.offer_signups for select to authenticated using(exists(select 1 from public.offer_pages p where p.id=page_id and p.user_id=auth.uid()));

-- Create or update your own page. Live pages: Free 1, Pro 10.
create function public.save_offer_page(page jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; live integer; want_live boolean := coalesce((page->>'published')::boolean,false); pid uuid := nullif(page->>'id','')::uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pages'||auth.uid()::text,0));
 if (select count(*) from public.offer_pages where user_id=auth.uid() and (pid is null or id<>pid))>=20 then raise exception 'Page limit reached'; end if;
 if want_live then
  select count(*) into live from public.offer_pages where user_id=auth.uid() and published and (pid is null or id<>pid);
  if live >= (case when public.plan_of(auth.uid())='pro' then 10 else 1 end) then raise exception 'Live page limit reached'; end if;
 end if;
 if pid is null then
  insert into public.offer_pages(user_id,slug,offer_ref,headline,subhead,bullets,price,cta,question,founder_name,published)
  values(auth.uid(),page->>'slug',coalesce(page->>'offer_ref',''),page->>'headline',coalesce(page->>'subhead',''),coalesce(page->'bullets','[]'),
    coalesce(page->>'price',''),coalesce(nullif(page->>'cta',''),'Join the waitlist'),coalesce(page->>'question',''),coalesce(page->>'founder_name',''),want_live)
  returning id into result;
 else
  update public.offer_pages set slug=page->>'slug',offer_ref=coalesce(page->>'offer_ref',''),headline=page->>'headline',subhead=coalesce(page->>'subhead',''),
    bullets=coalesce(page->'bullets','[]'),price=coalesce(page->>'price',''),cta=coalesce(nullif(page->>'cta',''),'Join the waitlist'),
    question=coalesce(page->>'question',''),founder_name=coalesce(page->>'founder_name',''),published=want_live,updated=now()
  where id=pid and user_id=auth.uid() returning id into result;
  if result is null then raise exception 'Page not found'; end if;
 end if;
 return result;
end; $$;
create function public.mark_signups_imported(ids uuid[]) returns integer language sql security definer set search_path='' as $$
  with u as (update public.offer_signups s set imported=true where s.id=any(ids) and exists(select 1 from public.offer_pages p where p.id=s.page_id and p.user_id=auth.uid()) returning 1)
  select count(*)::integer from u;
$$;
-- Public (anonymous) reads and sign-ups. Only published, unblocked pages.
create function public.public_offer_page(page_slug text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.offer_pages;
begin
 update public.offer_pages set views=views+1 where slug=page_slug and published and not blocked returning * into r;
 if r.id is null then return null; end if;
 return jsonb_build_object('slug',r.slug,'headline',r.headline,'subhead',r.subhead,'bullets',r.bullets,'price',r.price,'cta',r.cta,'question',r.question,'founder_name',r.founder_name);
end; $$;
create function public.submit_offer_signup(page_slug text,signup_name text,signup_email text,signup_answer text) returns boolean language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 select id into pid from public.offer_pages where slug=page_slug and published and not blocked;
 if pid is null then raise exception 'Page not found'; end if;
 if (select count(*) from public.offer_signups where page_id=pid)>=2000 then raise exception 'Page is full'; end if;
 insert into public.offer_signups(page_id,name,email,answer) values(pid,trim(signup_name),lower(trim(signup_email)),coalesce(signup_answer,''))
 on conflict do nothing;
 return true;
end; $$;

/* ---------- Office hours (mentor directory and requests) ---------- */
create table public.mentors(
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 80),
  headline text not null check(length(trim(headline)) between 1 and 140),
  bio text not null default '' check(length(bio)<=2000),
  expertise text[] not null default '{}' check(cardinality(expertise)<=8),
  rate text not null default '' check(length(rate)<=80),
  booking_url text not null default '' check(booking_url='' or (booking_url ~ '^https://' and length(booking_url)<=300)),
  approved boolean not null default false,
  active boolean not null default true,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);
create table public.mentor_requests(
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(user_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null check(length(trim(requester_name)) between 1 and 80),
  topic text not null check(length(trim(topic)) between 1 and 140),
  message text not null default '' check(length(message)<=2000),
  status text not null default 'new' check(status in ('new','accepted','declined','done')),
  reply text not null default '' check(length(reply)<=2000),
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);
create index mentor_requests_mentor on public.mentor_requests(mentor_id,created desc);
create index mentor_requests_user on public.mentor_requests(user_id,created desc);
alter table public.mentors enable row level security;
alter table public.mentor_requests enable row level security;
create policy read_mentors on public.mentors for select to authenticated using(public.has_pilot_access() and ((approved and active) or user_id=auth.uid()));
create policy read_requests on public.mentor_requests for select to authenticated using(user_id=auth.uid() or mentor_id=auth.uid());
-- Approval is set by the NextMade team (update mentors set approved=true where user_id=...). Edits keep the approval.
create function public.save_mentor_profile(p jsonb) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 insert into public.mentors(user_id,name,headline,bio,expertise,rate,booking_url,active)
 values(auth.uid(),p->>'name',p->>'headline',coalesce(p->>'bio',''),
   coalesce((select array_agg(left(t,40)) from (select jsonb_array_elements_text(coalesce(p->'expertise','[]')) t limit 8) x),'{}'),
   coalesce(p->>'rate',''),coalesce(p->>'booking_url',''),coalesce((p->>'active')::boolean,true))
 on conflict(user_id) do update set name=excluded.name,headline=excluded.headline,bio=excluded.bio,expertise=excluded.expertise,rate=excluded.rate,
   booking_url=excluded.booking_url,active=excluded.active,updated=now();
 return true;
end; $$;
-- Requests: Free 1 per 30 days, Pro 10 per 30 days.
create function public.request_mentor(mentor uuid,req_name text,req_topic text,req_message text) returns uuid language plpgsql security definer set search_path='' as $$
declare used integer; result uuid;
begin
 if not public.has_pilot_access() then raise exception 'Access denied'; end if;
 if mentor=auth.uid() then raise exception 'Cannot request yourself'; end if;
 if not exists(select 1 from public.mentors where user_id=mentor and approved and active) then raise exception 'Mentor unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended('mentor'||auth.uid()::text,0));
 select count(*) into used from public.mentor_requests where user_id=auth.uid() and created>now()-interval '30 days';
 if used >= (case when public.plan_of(auth.uid())='pro' then 10 else 1 end) then raise exception 'Request limit reached'; end if;
 insert into public.mentor_requests(mentor_id,user_id,requester_name,topic,message) values(mentor,auth.uid(),req_name,req_topic,coalesce(req_message,'')) returning id into result;
 return result;
end; $$;
create function public.answer_mentor_request(req uuid,new_status text,reply_text text) returns boolean language sql security definer set search_path='' as $$
  update public.mentor_requests set status=new_status,reply=coalesce(reply_text,''),updated=now() where id=req and mentor_id=auth.uid() and new_status in ('accepted','declined','done') returning true;
$$;

/* ---------- Account deletion covers the new tables ---------- */
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
 delete from public.catalog where created_by=auth.uid();
 delete from public.api_keys where user_id=auth.uid();
 delete from public.offer_pages where user_id=auth.uid();
 delete from public.mentor_requests where user_id=auth.uid();
 delete from public.mentors where user_id=auth.uid();
 delete from public.upgrade_requests where user_id=auth.uid();
 return true;
end; $$;

/* ---------- Grants ---------- */
revoke all on public.plans,public.upgrade_requests,public.catalog,public.api_keys,public.offer_pages,public.offer_signups,public.mentors,public.mentor_requests from anon,authenticated;
grant select on public.plans,public.upgrade_requests,public.offer_pages,public.offer_signups,public.mentors,public.mentor_requests to authenticated;
grant insert on public.upgrade_requests to authenticated;
grant select(id,kind,title,summary,market,category,tags,scores,demand,canada,created_by,shared,created) on public.catalog to authenticated;
grant delete on public.catalog,public.offer_pages to authenticated;
grant select(id,name,prefix,created,last_used) on public.api_keys to authenticated;
grant delete on public.api_keys to authenticated;

revoke all on function public.plan_of(uuid),public.my_plan(),public.catalog_entry(uuid),public.add_catalog_entry(jsonb),public.share_catalog_entry(uuid,boolean),public.research_used(),
  public.create_api_key(text,text,text),public.mcp_user(text),public.mcp_workspace(text),public.mcp_save_workspace(text,jsonb,integer),public.mcp_catalog(text,text,text,integer),public.mcp_catalog_entry(text,uuid),
  public.save_offer_page(jsonb),public.mark_signups_imported(uuid[]),public.public_offer_page(text),public.submit_offer_signup(text,text,text,text),
  public.save_mentor_profile(jsonb),public.request_mentor(uuid,text,text,text),public.answer_mentor_request(uuid,text,text) from public,anon,authenticated;
grant execute on function public.my_plan(),public.catalog_entry(uuid),public.add_catalog_entry(jsonb),public.share_catalog_entry(uuid,boolean),public.research_used(),
  public.create_api_key(text,text,text),public.save_offer_page(jsonb),public.mark_signups_imported(uuid[]),
  public.save_mentor_profile(jsonb),public.request_mentor(uuid,text,text,text),public.answer_mentor_request(uuid,text,text) to authenticated;
-- Key-authenticated MCP calls and public offer pages run without a member session.
grant execute on function public.mcp_workspace(text),public.mcp_save_workspace(text,jsonb,integer),public.mcp_catalog(text,text,text,integer),public.mcp_catalog_entry(text,uuid),
  public.public_offer_page(text),public.submit_offer_signup(text,text,text,text) to anon,authenticated;
commit;
