-- Royal Mission Portal — profiles.email altijd gelijk aan het echte
-- inlog-e-mailadres (auth.users.email).
-- Run dit in de Supabase SQL editor, ná 0001 en 0002.
--
-- Aanleiding: profiles.email is ooit rechtstreeks in de Supabase Table
-- Editor aangepast. Dat verandert alleen het weergaveveld in `profiles`,
-- niet het echte inlogadres in auth.users — met als gevolg dat de admin
-- een wachtwoord "instelde" voor een e-mailadres waarmee niemand kan
-- inloggen. Deze migratie voorkomt dat structureel.

-- 1. profiles.email mag nooit rechtstreeks gewijzigd worden (ook niet door
--    een admin) — het is alleen een spiegel van auth.users.email.
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
  new.email := old.email;
  return new;
end;
$$;

-- 2. Wijzigt het e-mailadres in auth.users (bv. via de Supabase-dashboard
--    of een toekomstige "wijzig e-mailadres"-flow), dan volgt profiles.email
--    automatisch mee.
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger sync_profile_email_trigger
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email();
