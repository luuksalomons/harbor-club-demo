-- Royal Mission Portal — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────────
-- Mirrors auth.users with the app-specific fields (role, name, zorgcoach flag).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'docent', 'admin')),
  is_zorgcoach boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
-- Role/name are seeded from the metadata passed in on invite (see admin invite flow).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used inside RLS policies to avoid recursive selects on profiles.
create function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.i_am_zorgcoach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_zorgcoach from public.profiles where id = auth.uid()), false);
$$;

-- ── school_years ────────────────────────────────────────────────────────────
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. "2025-2026"
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── enrollments (student ↔ school year) ────────────────────────────────────
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, school_year_id)
);

-- ── news_posts ──────────────────────────────────────────────────────────────
create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ── schedule_items (rooster, per schooljaar) ───────────────────────────────
create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  title text not null,
  description text not null default '',
  location text not null default '',
  teacher_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ── messages (intern berichtensysteem) ─────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ── care_requests (zorggesprek aanvragen) ──────────────────────────────────
create table public.care_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'in_behandeling', 'afgerond')),
  created_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.enrollments enable row level security;
alter table public.news_posts enable row level security;
alter table public.schedule_items enable row level security;
alter table public.messages enable row level security;
alter table public.care_requests enable row level security;

-- profiles: iedereen ingelogd mag alle profielen lezen (nodig voor rooster/berichten/admin).
-- Alleen admin mag rol/zorgcoach-vlag aanpassen; iedereen mag zijn eigen naam bijwerken.
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own_name" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.my_role() = 'admin');

-- school_years: iedereen leest, alleen admin beheert.
create policy "school_years_select_all" on public.school_years
  for select using (auth.role() = 'authenticated');

create policy "school_years_write_admin" on public.school_years
  for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- enrollments: admin beheert; student ziet zijn eigen inschrijving, docent/admin zien alles.
create policy "enrollments_select" on public.enrollments
  for select using (
    student_id = auth.uid() or public.my_role() in ('docent', 'admin')
  );

create policy "enrollments_write_admin" on public.enrollments
  for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- news_posts: iedereen leest; docent/admin schrijven; auteur of admin bewerkt/verwijdert.
create policy "news_select_all" on public.news_posts
  for select using (auth.role() = 'authenticated');

create policy "news_insert_docent_admin" on public.news_posts
  for insert with check (public.my_role() in ('docent', 'admin'));

create policy "news_update_own_or_admin" on public.news_posts
  for update using (author_id = auth.uid() or public.my_role() = 'admin');

create policy "news_delete_own_or_admin" on public.news_posts
  for delete using (author_id = auth.uid() or public.my_role() = 'admin');

-- schedule_items: iedereen leest; docent/admin schrijven.
create policy "schedule_select_all" on public.schedule_items
  for select using (auth.role() = 'authenticated');

create policy "schedule_write_docent_admin" on public.schedule_items
  for all using (public.my_role() in ('docent', 'admin'))
  with check (public.my_role() in ('docent', 'admin'));

-- messages: alleen zender/ontvanger zien het bericht; zender verstuurt; ontvanger mag read_at zetten.
create policy "messages_select_own" on public.messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages_insert_own" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "messages_update_mark_read" on public.messages
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- care_requests: student ziet/maakt zijn eigen aanvragen; zorgcoach/admin zien en beheren alles.
create policy "care_select" on public.care_requests
  for select using (
    student_id = auth.uid() or public.i_am_zorgcoach() or public.my_role() = 'admin'
  );

create policy "care_insert_own" on public.care_requests
  for insert with check (student_id = auth.uid());

create policy "care_update_zorgcoach_admin" on public.care_requests
  for update using (public.i_am_zorgcoach() or public.my_role() = 'admin');
