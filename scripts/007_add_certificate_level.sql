-- Add certificate level support (1-5 levels for different achievement levels)
-- This migration adds the certificate_level column to track the achievement level

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS certificate_level INTEGER DEFAULT 1 CHECK (certificate_level >= 1 AND certificate_level <= 5);

-- Add comment explaining the levels
COMMENT ON COLUMN certificates.certificate_level IS 'Certificate achievement level (1=Foundation, 2=Intermediate, 3=Advanced, 4=Professional, 5=Expert)';

-- Create index for filtering by level
CREATE INDEX IF NOT EXISTS idx_certificates_level ON certificates(certificate_level);
