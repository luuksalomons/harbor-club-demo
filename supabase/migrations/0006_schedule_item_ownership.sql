-- Royal Mission Portal — docenten mogen alleen zelf aangemaakte
-- rooster-/agendapunten verwijderen (bewerken); admin blijft alles mogen.
-- Run dit in de Supabase SQL editor, ná 0005_page_toggles.sql.
--
-- schedule_items had tot nu toe geen aparte "maker"-kolom: teacher_id is de
-- (optionele) docent die aan de les gekoppeld is, niet per se wie het item
-- aanmaakte. created_by legt dat apart vast, gezet door de server action
-- vanuit de ingelogde gebruiker (niet client-input) — dus niet te vervalsen.
-- Bestaande rijen krijgen created_by = null; die blijven, net als voorheen
-- bij een normale rol-check, alleen door een admin verwijderbaar totdat een
-- docent ze opnieuw aanmaakt.

alter table public.schedule_items
  add column created_by uuid references public.profiles (id) on delete set null;

drop policy "schedule_write_docent_admin" on public.schedule_items;

create policy "schedule_insert_docent_admin" on public.schedule_items
  for insert with check (
    public.my_role() in ('docent', 'admin') and created_by = auth.uid()
  );

create policy "schedule_update_own_or_admin" on public.schedule_items
  for update using (created_by = auth.uid() or public.my_role() = 'admin')
  with check (created_by = auth.uid() or public.my_role() = 'admin');

create policy "schedule_delete_own_or_admin" on public.schedule_items
  for delete using (created_by = auth.uid() or public.my_role() = 'admin');
