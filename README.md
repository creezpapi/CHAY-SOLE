# CHAY SOLE Admin

Live site: https://chay-sole.vercel.app

## What's New (Migration 003)

> **Before redeploying: run `supabase/migrations/003_features_drop_tasks_influencer_packages.sql` in the Supabase SQL Editor.**

Five features were added in this release:

1. **Product form** — Drop Name, Drop Date, Description, Talking Points, and an Affiliate Links repeater (URL + code pairs) were added to the Add/Edit Product form. Product tiles in CHAY SOLE DROPS are now clickable and open a detail modal with a pencil-icon Edit toggle.

2. **Creatives page** — existing add-creative flow verified working (products storage bucket + RLS policies already in place).

3. **Tasks page** (`/admin/tasks`) — manage a task list (title, assignee, due date, completed toggle) and a brand calendar (month grid view; click a day to add/edit/delete entries).

4. **Influencer Marketing page** (`/admin/influencer-marketing`) — Organic Collab and Paid Collab tabs with per-influencer status pills; influencer profile modal with Shipping Info block, Links & Notes block, and a Ready To Ship button that snapshots the influencer into the Package Tracker.

5. **Package Tracker page** (`/admin/package-tracker`) — three blocks: Ready To Ship → Shipped (enter tracking URL) → Delivered. Automatically updates the parent influencer's status when a shipment transitions.

## Stack

- Next.js 14 (App Router)
- Supabase (auth + postgres + storage)
- Tailwind CSS
- Vercel

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
