-- Add terms_accepted and profile_completed columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for profile completion checks
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted);
