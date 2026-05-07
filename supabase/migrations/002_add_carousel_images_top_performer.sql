-- Migration 002: Add carousel_images and is_top_performer to creatives
-- Run this against your Supabase database

-- Add carousel_images array column
alter table public.creatives
  add column if not exists carousel_images text[] not null default '{}';

-- Add is_top_performer boolean column
alter table public.creatives
  add column if not exists is_top_performer boolean not null default false;

-- Index for fast top-performer filtering
create index if not exists creatives_top_performer_idx on public.creatives(is_top_performer)
  where is_top_performer = true;

-- Index for fast whitelisting filtering (creatives with an ad_code)
create index if not exists creatives_ad_code_idx on public.creatives(ad_code)
  where ad_code is not null;
