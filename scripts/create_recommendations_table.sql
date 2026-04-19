-- Create recommendations and endorsements table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('recommendation', 'endorsement')),
  language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'pt')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recommendations_student_id ON recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_program_id ON recommendations(program_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_student_program ON recommendations(student_id, program_id);

-- Enable RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Students can view their own recommendations"
  ON recommendations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all recommendations"
  ON recommendations FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert recommendations"
  ON recommendations FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update recommendations"
  ON recommendations FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can delete recommendations"
  ON recommendations FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
