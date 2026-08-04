-- Translation Requests Table
CREATE TABLE IF NOT EXISTS public.translation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_file_url TEXT NOT NULL,
  total_pages INTEGER NOT NULL DEFAULT 1,
  languages_requested TEXT[] NOT NULL, -- Array of language codes: ['fr', 'pt', 'ar', 'es', 'en', 'ur', 'ru', 'bn', 'hi']
  total_cost_cents INTEGER NOT NULL, -- (pages * languages_count * 2500)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, payment_initiated, paid, processing, completed, failed
  payment_method TEXT, -- paystack, stripe
  paystack_reference TEXT,
  receipt_url TEXT,
  translated_documents_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translation Payments Table
CREATE TABLE IF NOT EXISTS public.translation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_request_id UUID NOT NULL REFERENCES public.translation_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded
  paystack_reference TEXT,
  payment_gateway TEXT NOT NULL DEFAULT 'paystack',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_translation_requests_user_id ON public.translation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_status ON public.translation_requests(status);
CREATE INDEX IF NOT EXISTS idx_translation_requests_paystack_ref ON public.translation_requests(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_translation_payments_user_id ON public.translation_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_payments_status ON public.translation_payments(status);
CREATE INDEX IF NOT EXISTS idx_translation_payments_paystack_ref ON public.translation_payments(paystack_reference);
