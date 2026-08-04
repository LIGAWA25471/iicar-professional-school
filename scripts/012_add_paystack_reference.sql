-- Add paystack_reference column to payments table if it doesn't exist
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paystack_reference TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference ON public.payments(paystack_reference);

-- Also add an updated_at column if missing
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
