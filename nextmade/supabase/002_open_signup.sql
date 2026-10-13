-- NextMade: open sign-up with email confirmation.
-- Run once in the Supabase SQL Editor AFTER 001_nextmade.sql.
-- Every account gets workspace access automatically as soon as its email address is confirmed,
-- so the owner no longer has to add people to pilot_access by hand.
-- To return to invite-only later: drop trigger nextmade_grant_on_confirm on auth.users;

create or replace function public.grant_access_on_confirm() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.pilot_access(user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.grant_access_on_confirm() from public, anon, authenticated;

drop trigger if exists nextmade_grant_on_confirm on auth.users;
create trigger nextmade_grant_on_confirm
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.grant_access_on_confirm();

-- Give access to anyone who has already confirmed their email.
insert into public.pilot_access(user_id)
select id from auth.users where email_confirmed_at is not null
on conflict do nothing;
