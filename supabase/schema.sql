-- GUILDER Supabase Schema
-- Run this in the Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Users profile table (linked to auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Travel records table
create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photos text[] not null default '{}',
  memo text,
  story text,
  location_name text,
  latitude float8,
  longitude float8,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists records_user_id_idx on public.records (user_id);
create index if not exists records_created_at_idx on public.records (created_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.users enable row level security;
alter table public.records enable row level security;

-- Users policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Records policies
create policy "Users can view own records"
  on public.records for select
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on public.records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.records for update
  using (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.records for delete
  using (auth.uid() = user_id);

-- Storage bucket for record photos
insert into storage.buckets (id, name, public)
values ('record-photos', 'record-photos', true)
on conflict (id) do nothing;

create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'record-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view record photos"
  on storage.objects for select
  using (bucket_id = 'record-photos');

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'record-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
