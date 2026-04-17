-- Add language column to certificates table
ALTER TABLE certificates ADD COLUMN language VARCHAR(10) DEFAULT 'en' NOT NULL;

-- Add language constraint to ensure only valid languages
ALTER TABLE certificates ADD CONSTRAINT valid_language CHECK (language IN ('en', 'fr', 'pt'));

-- Create index for faster lookups by language
CREATE INDEX idx_certificates_language ON certificates(language);
