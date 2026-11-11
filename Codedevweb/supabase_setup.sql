-- ============================================================
-- CodeDev – Run this ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- 1. Create site_settings table (key-value store)
create table if not exists public.site_settings (
  key   text primary key,
  value text not null default ''
);

-- 2. Enable Row Level Security
alter table public.site_settings enable row level security;

-- 3. Public can READ settings (logo shows on login page without auth)
create policy "public read site_settings"
  on public.site_settings
  for select
  using (true);

-- 4. Only authenticated admins can INSERT / UPDATE / DELETE
create policy "auth write site_settings"
  on public.site_settings
  for all
  using (auth.role() = 'authenticated');

-- 5. Seed default values (optional – update to your real values)
insert into public.site_settings (key, value) values
  ('logo_url',   '/images/logo.jpeg'),
  ('site_name',  'CodeDev'),
  ('tagline',    'India''s IT Job Portal'),
  ('wa_url',     'https://whatsapp.com/channel/0029Vb8aYEmEgGfNs7RIm43X'),
  ('instagram',  'https://instagram.com/codedev'),
  ('linkedin',   'https://linkedin.com/company/codedev'),
  ('email',      'hello@codedev.com'),
  ('meta_title', 'CodeDev – Find Your Next Tech Career | IT Jobs'),
  ('meta_desc',  'CodeDev is India''s IT job portal for discovering the latest software engineering jobs.'),
  ('site_url',   'https://codedev.com')
on conflict (key) do nothing;
