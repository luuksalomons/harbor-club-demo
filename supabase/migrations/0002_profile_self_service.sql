-- Royal Mission Portal — profielvelden + bescherming tegen zelf-promotie
-- Run dit in de Supabase SQL editor, ná 0001_init.sql.

alter table public.profiles
  add column age integer,
  add column gender text check (gender in ('man', 'vrouw', 'anders'));

-- De bestaande policy "profiles_update_own_name" staat een gebruiker toe om
-- élke kolom van zijn eigen rij te updaten (RLS werkt per rij, niet per
-- kolom) — inclusief role/is_zorgcoach via een directe API-call buiten de
-- app-UI om. Deze trigger zet die twee kolommen terug naar hun oude waarde
-- zodra de update niet door een admin gebeurt, ongeacht welke policy 'm
-- toestond.
create function public.protect_profile_privileges()
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
  return new;
end;
$$;

create trigger protect_profile_privileges_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();
