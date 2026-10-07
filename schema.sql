-- Run once in Supabase > SQL editor. Safe to re-run (also upgrades older installs).
create extension if not exists pgcrypto;
create table if not exists albums(
  id uuid primary key default gen_random_uuid(),
  title text not null, artist text, year int, genre text, description text,
  cover_link text, featured boolean default false, published boolean default true,
  created_at timestamptz default now());
create table if not exists tracks(
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,
  title text not null, artist text, track_no int default 1, duration int,
  art_link text, link_128 text, link_320 text, published boolean default true,
  created_at timestamptz default now());
alter table albums add column if not exists genre text;
alter table albums add column if not exists description text;
alter table albums add column if not exists featured boolean default false;
alter table albums add column if not exists published boolean default true;
alter table tracks add column if not exists duration int;
alter table tracks add column if not exists published boolean default true;
alter table albums enable row level security;
alter table tracks enable row level security;
drop policy if exists owner_albums on albums;
drop policy if exists owner_tracks on tracks;
create policy owner_albums on albums for all to authenticated using (true) with check (true);
create policy owner_tracks on tracks for all to authenticated using (true) with check (true);
insert into storage.buckets (id,name,public) values ('music','music',false) on conflict (id) do nothing;
drop policy if exists owner_music_files on storage.objects;
create policy owner_music_files on storage.objects for all to authenticated
  using (bucket_id='music') with check (bucket_id='music');
-- Then: Authentication > Providers > Email > turn OFF sign-ups; create your one user (Auto Confirm).
