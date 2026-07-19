-- FootTraffic (Moody Café) schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query) for a fresh project.
-- Each business-data table is scoped per-user via RLS: every row belongs to the
-- authenticated user who created it (auth.uid()), mirroring the original Base44
-- `created_by_id`-scoped entities.

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. Auto-created by the trigger below on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── helper: per-user CRUD policies ────────────────────────────────────────
-- (applied individually below per table since Postgres has no policy templates)

-- ── customers ───────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  loyalty_points integer not null default 0,
  total_visits integer not null default 0,
  total_spent numeric not null default 0,
  tier text not null default 'Bronze' check (tier in ('Bronze', 'Silver', 'Gold', 'Platinum')),
  last_visit_date date,
  join_date date,
  notes text,
  favorite_items text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── posts ───────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  caption text not null,
  image_url text,
  platform text not null default 'Instagram' check (platform in ('Instagram', 'Facebook')),
  status text not null default 'Draft' check (status in ('Draft', 'Scheduled', 'Published')),
  scheduled_date timestamptz,
  hashtags text,
  ai_generated boolean not null default false,
  likes integer not null default 0,
  comments integer not null default 0,
  reach integer not null default 0,
  post_type text not null default 'Promotion' check (post_type in ('Promotion', 'Product', 'Story', 'Educational', 'Community')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── newsletters ─────────────────────────────────────────────────────────────
create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null,
  content text,
  status text not null default 'Draft' check (status in ('Draft', 'Scheduled', 'Sent')),
  scheduled_date timestamptz,
  recipient_count integer not null default 0,
  open_rate numeric not null default 0,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── reviews ─────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null default 'Google' check (platform in ('Google', 'Yelp', 'Facebook', 'Instagram')),
  customer_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  content text not null,
  response text,
  status text not null default 'Pending' check (status in ('Pending', 'Responded')),
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── promotions ──────────────────────────────────────────────────────────────
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  discount_type text not null default 'Percentage' check (discount_type in ('Percentage', 'Fixed Amount', 'Buy One Get One', 'Free Item')),
  discount_value text,
  start_date date,
  end_date date,
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Expired')),
  target_segment text,
  ai_generated boolean not null default false,
  redemptions integer not null default 0,
  revenue_generated numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── ad_campaigns ────────────────────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  campaign_name text not null,
  platform text not null default 'Meta Ads' check (platform in ('Google Ads', 'Meta Ads', 'Instagram Ads', 'TikTok Ads')),
  spend numeric not null default 0,
  revenue numeric not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  start_date date,
  end_date date,
  status text not null default 'Active' check (status in ('Active', 'Paused', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── partnerships ────────────────────────────────────────────────────────────
create table if not exists public.partnerships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partner_name text not null,
  partner_type text,
  suggested_by_ai boolean not null default true,
  status text not null default 'Suggested' check (status in ('Suggested', 'Contacted', 'Active', 'Declined')),
  mutual_benefit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── RLS: enable + per-user policies for every business table ────────────────
do $$
declare
  t text;
begin
  foreach t in array array['customers', 'posts', 'newsletters', 'reviews', 'promotions', 'ad_campaigns', 'partnerships']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- ── updated_at auto-touch trigger ────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['customers', 'posts', 'newsletters', 'reviews', 'promotions', 'ad_campaigns', 'partnerships']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute procedure public.touch_updated_at()', t);
  end loop;
end $$;
