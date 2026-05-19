-- 004_cost_tracker.sql
-- Run this in the Supabase SQL Editor before deploying the Cost Tracker page.

-- Main expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date        NOT NULL,
  description   text        NOT NULL,
  category      text        NOT NULL DEFAULT 'other',
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  vendor        text,
  notes         text,
  receipt_path  text,
  receipt_url   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for month-based queries
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses(date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expenses_updated_at_trigger ON public.expenses;
CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_expenses_updated_at();

-- RLS: service role only (server actions bypass RLS via service key)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='expenses' AND policyname='Service role full access on expenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role full access on expenses" ON public.expenses FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Receipts storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;
