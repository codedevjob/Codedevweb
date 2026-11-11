-- ============================================================
-- CodeDev – Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- JOBS TABLE
create table if not exists jobs (
  id               text primary key default 'JOB' || extract(epoch from now())::bigint::text,
  slug             text unique not null,
  company          text not null,
  company_logo     text default '/images/companies/default.svg',
  title            text not null,
  location         text not null,
  experience       text not null,
  employment_type  text default 'Full Time',
  skills           text[] default '{}',
  salary           text default 'Not Disclosed',
  posted_date      date not null default current_date,
  expiry_date      date not null,
  description      text,
  responsibilities text[] default '{}',
  eligibility      text[] default '{}',
  education        text,
  application_url  text,
  featured         boolean default false,
  status           text default 'active' check (status in ('active','scheduled','draft')),
  scheduled_date   timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- REFERRALS TABLE
create table if not exists referrals (
  id               text primary key default 'REF' || extract(epoch from now())::bigint::text,
  slug             text unique not null,
  company          text not null,
  company_logo     text default '/images/companies/default.svg',
  title            text not null,
  location         text not null,
  experience       text not null,
  skills           text[] default '{}',
  salary           text default 'Not Disclosed',
  description      text,
  eligibility      text[] default '{}',
  referral_url     text,
  referral_deadline date,
  posted_date      date not null default current_date,
  status           text default 'active' check (status in ('active','scheduled','draft')),
  scheduled_date   timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- Public can only read active, non-expired jobs (backend enforces this via API,
-- but RLS adds a second layer of protection).

alter table jobs enable row level security;
alter table referrals enable row level security;

-- Allow public SELECT (our Express API uses service role key which bypasses RLS,
-- but this protects against direct Supabase client access from the browser)
create policy "Public read active jobs" on jobs
  for select using (
    status = 'active'
    and expiry_date >= current_date
    and (scheduled_date is null or scheduled_date <= now())
  );

create policy "Public read active referrals" on referrals
  for select using (
    status = 'active'
    and (referral_deadline is null or referral_deadline >= current_date)
    and (scheduled_date is null or scheduled_date <= now())
  );

-- Service role (used by our backend) bypasses RLS automatically.
-- No additional policies needed for admin writes.

-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists idx_jobs_slug        on jobs(slug);
create index if not exists idx_jobs_status      on jobs(status);
create index if not exists idx_jobs_expiry      on jobs(expiry_date);
create index if not exists idx_referrals_status on referrals(status);
