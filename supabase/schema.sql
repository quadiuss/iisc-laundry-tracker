-- =========================================================
-- IISc Laundry Tracker — Supabase Schema
-- Safe to run multiple times — it wipes and rebuilds cleanly,
-- so re-running this is always a safe way to reset/fix things.
-- Run in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================

-- Clean slate (removes any previous attempt)
drop table if exists public.profiles cascade;
drop table if exists public.machines cascade;

create table public.machines (
  id serial primary key,
  name text not null,
  status text not null default 'available' check (status in ('available', 'in_use')),
  last_used_by text,
  last_used_phone text,   -- so anyone can call the last person who used it
  last_used_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.machines enable row level security;

-- Anyone can VIEW machine status (no login system, so this is public read —
-- there's nothing sensitive in it).
create policy "Anyone can view machines"
  on public.machines for select
  using (true);

-- IMPORTANT: No insert/update/delete policy exists for the anon role.
-- The browser can NEVER write to this table directly. Only the Netlify
-- Function (using the secret service_role key, which bypasses RLS) can
-- write. This is what stops someone editing the database directly.

-- Seed the starter machines FIRST, before touching realtime settings below,
-- so this data exists no matter what happens with the publication step.
insert into public.machines (name, status) values
  ('Washing Machine 1', 'available'),
  ('Washing Machine 2', 'available'),
  ('Washing Machine 3', 'available'),
  ('Washing Machine 4', 'available');

-- Enable realtime updates on this table. Wrapped in error-handling so
-- that if your project's publication is already set up differently,
-- this step can never block or undo anything above it.
do $$
begin
  alter publication supabase_realtime add table public.machines;
exception
  when duplicate_object then
    raise notice 'machines was already in supabase_realtime publication — skipping.';
  when undefined_object then
    raise notice 'supabase_realtime publication not found — check Database > Replication in your dashboard and enable it there instead.';
end $$;

-- To add a 5th machine later, just run:
-- insert into public.machines (name, status) values ('Washing Machine 5', 'available');

-- ---------------------------------------------------------
-- VERIFY: run this on its own afterwards to double check
-- ---------------------------------------------------------
-- select * from public.machines;
