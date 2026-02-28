-- Ensure is_admin has a proper default of false (not null)
-- and that existing null values are set to false
ALTER TABLE profiles
  ALTER COLUMN is_admin SET DEFAULT false;

UPDATE profiles SET is_admin = false WHERE is_admin IS NULL;

ALTER TABLE profiles
  ALTER COLUMN is_admin SET NOT NULL;

-- Also ensure phone column exists
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text;
