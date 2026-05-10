-- Migration 003: Product affiliate links, tasks, influencer marketing, package tracker
-- Idempotent — safe to re-run

-- ============================================================
-- FEATURE 1: Product drop_name, drop_date, affiliate_links
-- ============================================================

alter table public.manual_products add column if not exists drop_name text;
alter table public.manual_products add column if not exists drop_date date;
alter table public.manual_products add column if not exists description text;
alter table public.manual_products add column if not exists talking_points text[] not null default '{}';
alter table public.manual_products add column if not exists admin_notes text;

-- drop_tag already added in prior session; ensure it exists
alter table public.manual_products add column if not exists drop_tag text;

create table if not exists public.product_affiliate_links (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.manual_products(id) on delete cascade,
  url text not null,
  code text,
  created_at timestamptz not null default now()
);
create index if not exists product_affiliate_links_product_idx on public.product_affiliate_links(product_id);
alter table public.product_affiliate_links enable row level security;

drop policy if exists "Admins can manage product_affiliate_links" on public.product_affiliate_links;
create policy "Admins can manage product_affiliate_links" on public.product_affiliate_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- FEATURE 3: Tasks & brand calendar
-- ============================================================

create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.team_members enable row level security;

drop policy if exists "Admins can manage team_members" on public.team_members;
create policy "Admins can manage team_members" on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  assignee_id uuid references public.team_members(id) on delete set null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_completed_idx on public.tasks(completed);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
alter table public.tasks enable row level security;

drop policy if exists "Admins can manage tasks" on public.tasks;
create policy "Admins can manage tasks" on public.tasks
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.brand_calendar_entries (
  id uuid primary key default uuid_generate_v4(),
  entry_date date not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists brand_calendar_entries_date_idx on public.brand_calendar_entries(entry_date);
alter table public.brand_calendar_entries enable row level security;

drop policy if exists "Admins can manage brand_calendar_entries" on public.brand_calendar_entries;
create policy "Admins can manage brand_calendar_entries" on public.brand_calendar_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- FEATURE 4: Influencer marketing
-- ============================================================

create table if not exists public.marketing_influencers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  collab_type text not null default 'organic',
  status text not null default 'collab_type_confirmed',
  shipping_address text,
  top_sizing text,
  bottom_sizing text,
  product_selects text,
  notes text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  partnership_notes text,
  created_at timestamptz not null default now()
);
create index if not exists marketing_influencers_collab_type_idx on public.marketing_influencers(collab_type);
create index if not exists marketing_influencers_status_idx on public.marketing_influencers(status);
alter table public.marketing_influencers enable row level security;

drop policy if exists "Admins can manage marketing_influencers" on public.marketing_influencers;
create policy "Admins can manage marketing_influencers" on public.marketing_influencers
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.marketing_influencer_posts (
  id uuid primary key default uuid_generate_v4(),
  marketing_influencer_id uuid not null references public.marketing_influencers(id) on delete cascade,
  post_url text not null,
  affiliate_code text,
  created_at timestamptz not null default now()
);
create index if not exists marketing_influencer_posts_influencer_idx on public.marketing_influencer_posts(marketing_influencer_id);
alter table public.marketing_influencer_posts enable row level security;

drop policy if exists "Admins can manage marketing_influencer_posts" on public.marketing_influencer_posts;
create policy "Admins can manage marketing_influencer_posts" on public.marketing_influencer_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- FEATURE 5: Package tracker (replaces notifications)
-- ============================================================

create table if not exists public.marketing_shipments (
  id uuid primary key default uuid_generate_v4(),
  marketing_influencer_id uuid not null references public.marketing_influencers(id) on delete cascade,
  influencer_name_snapshot text not null,
  shipping_address_snapshot text,
  top_sizing_snapshot text,
  bottom_sizing_snapshot text,
  product_selects_snapshot text,
  notes_snapshot text,
  status text not null default 'ready_to_ship',
  tracking_url text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists marketing_shipments_status_idx on public.marketing_shipments(status);
create index if not exists marketing_shipments_influencer_idx on public.marketing_shipments(marketing_influencer_id);
alter table public.marketing_shipments enable row level security;

drop policy if exists "Admins can manage marketing_shipments" on public.marketing_shipments;
create policy "Admins can manage marketing_shipments" on public.marketing_shipments
  for all using (public.is_admin()) with check (public.is_admin());
