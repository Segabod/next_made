-- NextMade: instant access without email confirmation.
-- Run once in the Supabase SQL Editor AFTER 002_open_signup.sql, and turn OFF
-- Authentication -> Sign In / Providers -> Email -> "Confirm email".
-- Every new account gets workspace access the moment it is created.
-- To require confirmation again: turn "Confirm email" back on and re-run 002_open_signup.sql.

create or replace function public.grant_access_on_confirm() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pilot_access(user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.grant_access_on_confirm() from public, anon, authenticated;

drop trigger if exists nextmade_grant_on_confirm on auth.users;
create trigger nextmade_grant_on_confirm
  after insert on auth.users
  for each row execute function public.grant_access_on_confirm();

-- Give access to everyone who signed up before, including anyone who never confirmed.
insert into public.pilot_access(user_id)
select id from auth.users
on conflict do nothing;
