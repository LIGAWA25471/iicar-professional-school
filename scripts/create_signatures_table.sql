-- Create signatures table for managing admin signatures
CREATE TABLE IF NOT EXISTS public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_type text NOT NULL CHECK (signature_type IN ('upload', 'drawn', 'typed')),
  signature_data text NOT NULL,
  signature_name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Simple permissive policy for testing (admin client will bypass this anyway)
DROP POLICY IF EXISTS "Enable all access for admin client" ON public.signatures;
CREATE POLICY "Enable all access for admin client" ON public.signatures FOR ALL USING (true);

-- Create indexes
DROP INDEX IF EXISTS idx_signatures_user_id;
DROP INDEX IF EXISTS idx_signatures_is_active;
CREATE INDEX idx_signatures_user_id ON public.signatures(user_id);
CREATE INDEX idx_signatures_is_active ON public.signatures(is_active);
