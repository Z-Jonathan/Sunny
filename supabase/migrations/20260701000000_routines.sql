-- Cross-device routine sync: one row per user, RLS-scoped so a user can only
-- read/write their own row. `updated_at` is client epoch millis and drives
-- last-write-wins conflict resolution.

create table if not exists public.routines (
  user_id     uuid    primary key references auth.users (id) on delete cascade,
  day         text    not null,
  activities  jsonb   not null default '[]'::jsonb,
  next_id     integer not null default 1,
  updated_at  bigint  not null
);

alter table public.routines enable row level security;

-- Each policy restricts rows to the authenticated owner.
create policy "routines_select_own"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "routines_insert_own"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "routines_update_own"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routines_delete_own"
  on public.routines for delete
  using (auth.uid() = user_id);

-- Emit realtime change events so other devices see edits live.
alter publication supabase_realtime add table public.routines;
