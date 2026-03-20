-- ============================================================
-- Certificate Approval Workflow Migration
-- Adds approval status, admin signatures, and logo support
-- ============================================================

-- Add approval workflow columns to certificates table
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending','approved','rejected')) NOT NULL DEFAULT 'pending';

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Create table to store admin signatures
CREATE TABLE IF NOT EXISTS public.admin_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signature_name TEXT NOT NULL,
  signature_title TEXT NOT NULL DEFAULT 'Administrator',
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_signatures ENABLE ROW LEVEL SECURITY;

-- Only admins can manage signatures
CREATE POLICY "signatures_admin_all" ON public.admin_signatures FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- Index for faster approval status queries
CREATE INDEX IF NOT EXISTS certificates_approval_status_idx ON public.certificates(approval_status);

-- Update certificates to include signature references
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS primary_signature_id UUID REFERENCES public.admin_signatures(id);

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS secondary_signature_id UUID REFERENCES public.admin_signatures(id);
