-- Run in Supabase > SQL editor
create extension if not exists pgcrypto;
create table albums(
  id uuid primary key default gen_random_uuid(),
  title text not null, artist text, year int,
  cover_link text,                -- Mega public link, square album art
  created_at timestamptz default now());
create table tracks(
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,  -- null = single
  title text not null, artist text, track_no int default 1,
  art_link text,                  -- Mega public link, square track art
  link_128 text, link_320 text,   -- Mega public links, audio
  created_at timestamptz default now());
alter table albums enable row level security;
alter table tracks enable row level security;
create policy owner_albums on albums for all to authenticated using (true) with check (true);
create policy owner_tracks on tracks for all to authenticated using (true) with check (true);
-- Then: Authentication > Providers > Email > turn OFF "Allow new users to sign up",
-- and create your one user under Authentication > Users.
