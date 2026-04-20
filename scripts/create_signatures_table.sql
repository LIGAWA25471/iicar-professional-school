-- Create signatures table for managing admin signatures
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_type VARCHAR(50) NOT NULL, -- 'upload', 'drawn', 'typed'
  signature_data TEXT, -- Base64 encoded image data or typed name
  signature_name VARCHAR(255), -- Display name for the signature
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage signatures
CREATE POLICY "Admins can manage signatures"
  ON signatures FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Create index for faster queries
CREATE INDEX idx_signatures_user_id ON signatures(user_id);
CREATE INDEX idx_signatures_is_active ON signatures(is_active);
