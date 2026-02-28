-- Create program_modules table for AI-generated course content
CREATE TABLE IF NOT EXISTS program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_outcomes TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  duration_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, module_number)
);

-- Index for fast lookup by program
CREATE INDEX IF NOT EXISTS idx_program_modules_program_id ON program_modules(program_id);

-- Enable RLS
ALTER TABLE program_modules ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (via service role, bypasses RLS)
-- Students can read modules for programs they are enrolled in
CREATE POLICY IF NOT EXISTS "Students can read modules of enrolled programs"
  ON program_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.program_id = program_modules.program_id
        AND enrollments.student_id = auth.uid()
        AND enrollments.payment_status = 'paid'
    )
  );
