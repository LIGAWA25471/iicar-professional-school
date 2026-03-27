-- Add certificate_level column to certificates table
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS certificate_level INTEGER NOT NULL DEFAULT 1 CHECK (certificate_level >= 1 AND certificate_level <= 5);
