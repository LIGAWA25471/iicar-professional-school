-- ============================================================
-- Migration: Add KopoKopo columns to payments table
-- ============================================================

-- Add kopokopo-specific columns (safe to run multiple times)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS kopokopo_location    TEXT,
  ADD COLUMN IF NOT EXISTS kopokopo_reference   TEXT,
  ADD COLUMN IF NOT EXISTS phone_number         TEXT,
  ADD COLUMN IF NOT EXISTS metadata             JSONB;

-- Widen currency default to KES (it was 'usd')
ALTER TABLE public.payments
  ALTER COLUMN currency SET DEFAULT 'KES';
