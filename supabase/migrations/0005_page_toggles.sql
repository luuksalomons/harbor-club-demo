-- Royal Mission Portal — pagina's aan/uit kunnen zetten vanuit Admin.
-- Run dit in de Supabase SQL editor, ná 0004_fix_email_sync.sql.
--
-- Elke rij is een onderdeel van de app dat de admin kan in-/uitschakelen
-- zonder deploy. "Home" en "Admin" zijn bewust niet uitschakelbaar (geen
-- rij voor), zodat een admin zichzelf nooit buitensluit.

create table public.app_features (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.app_features (key, label) values
  ('nieuws', 'Nieuws'),
  ('rooster', 'Rooster'),
  ('berichten', 'Berichten'),
  ('zorg', 'Zorggesprek'),
  ('info', 'Info');

alter table public.app_features enable row level security;

-- iedereen ingelogd leest (nodig om nav/pagina's te kunnen tonen/blokkeren),
-- alleen admin schakelt in/uit.
create policy "app_features_select_all" on public.app_features
  for select using (auth.role() = 'authenticated');

create policy "app_features_update_admin" on public.app_features
  for update using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
