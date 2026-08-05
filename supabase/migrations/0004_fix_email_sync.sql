-- Royal Mission Portal — fix: de e-mail-vergrendeling uit 0003 blokkeerde
-- ook haar eigen synchronisatie-trigger.
-- Run dit in de Supabase SQL editor, ná 0003_email_sync.sql.
--
-- protect_profile_privileges() zette new.email altijd terug naar old.email,
-- ook wanneer de update kwam van sync_profile_email() zelf (die juist het
-- nieuwe e-mailadres van auth.users wilde doorzetten). Resultaat: een
-- e-mailwijziging in auth.users kwam nooit aan in profiles.email. Deze
-- migratie laat de sync-trigger een sessie-vlag zetten die de vergrendeling
-- herkent en dan wél doorlaat.

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('rm_portal.syncing_email', 'true', true);
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() <> 'admin' then
    new.role := old.role;
    new.is_zorgcoach := old.is_zorgcoach;
  end if;
  if coalesce(current_setting('rm_portal.syncing_email', true), '') <> 'true' then
    new.email := old.email;
  end if;
  return new;
end;
$$;
