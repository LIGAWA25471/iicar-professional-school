# Special Exams Feature - Database Setup

The Special Exams feature requires database tables to be created in your Supabase project.

## Quick Setup

Run this SQL in your Supabase SQL Editor (https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new):

```sql
-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  passing_score INTEGER DEFAULT 70,
  total_questions INTEGER DEFAULT 50,
  status TEXT CHECK (status IN ('draft', 'published', 'scheduled', 'active', 'closed')) DEFAULT 'draft',
  share_token TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  allow_retakes BOOLEAN DEFAULT TRUE,
  show_results BOOLEAN DEFAULT TRUE,
  show_correct_answers BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_questions CHECK (total_questions >= 50 AND total_questions <= 100)
);

-- Create exam questions table
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')) DEFAULT 'multiple_choice',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  order_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  respondent_id UUID,
  respondent_email TEXT,
  respondent_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  passed BOOLEAN,
  time_taken_seconds INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT response_type CHECK ((respondent_id IS NOT NULL) OR (respondent_email IS NOT NULL))
);

-- Create exam question responses table
CREATE TABLE IF NOT EXISTS exam_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  is_correct BOOLEAN,
  marks_obtained INTEGER,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_share_token ON exams(share_token);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_respondent ON exam_attempts(respondent_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_question_responses_attempt ON exam_question_responses(attempt_id);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "exams_public_select" ON exams FOR SELECT USING (status IN ('published', 'active', 'scheduled'));
CREATE POLICY "exams_admin_all" ON exams USING ((SELECT is_admin FROM profiles WHERE profiles.id = auth.uid() LIMIT 1) = true);
CREATE POLICY "exam_attempts_insert" ON exam_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "exam_attempts_select_own" ON exam_attempts FOR SELECT USING (respondent_id = auth.uid() OR respondent_email IS NOT NULL);
CREATE POLICY "exam_question_responses_insert" ON exam_question_responses FOR INSERT WITH CHECK (attempt_id IN (SELECT id FROM exam_attempts WHERE respondent_id = auth.uid() OR respondent_email IS NOT NULL));
CREATE POLICY "exam_question_responses_select" ON exam_question_responses FOR SELECT USING (attempt_id IN (SELECT id FROM exam_attempts WHERE respondent_id = auth.uid() OR respondent_email IS NOT NULL));
```

## Steps

1. Go to Supabase Dashboard
2. Click SQL Editor
3. Paste the above SQL
4. Click Run
5. Refresh your page

Done! The exam feature is now ready to use.
