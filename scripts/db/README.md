# Database Migration Scripts

This folder contains SQL migration scripts for setting up and maintaining the IICAR Professional School database.

## Available Scripts

### 01_create_exams_tables.sql

Creates all tables needed for the Special Exams feature:

- **exams** - Exam metadata, settings, and status
- **exam_questions** - Individual questions (AI-generated, 50-100 per exam)
- **exam_attempts** - Student submissions and scores
- **exam_question_responses** - Individual answer tracking

**Features:**
- Row Level Security (RLS) policies for data protection
- Automatic timestamp tracking (created_at, updated_at)
- Proper foreign key constraints and cascading deletes
- Optimized indexes for query performance
- Support for anonymous test takers (via email)

**Running the script:**

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of this file
5. Click Run
6. Wait for completion (10-30 seconds)

**Verification:**

After running, you should see:
- 4 new tables created
- 7 indexes created
- 2 trigger functions created
- 7 RLS policies created

The Special Exams page will no longer show setup errors.

## Notes

- Scripts use `IF NOT EXISTS` clauses for idempotency
- Policies use `DROP POLICY IF EXISTS` to prevent conflicts
- All scripts follow PostgreSQL 13+ syntax (Supabase standard)
- Row Level Security is enabled on all exam-related tables

## Troubleshooting

**Error: column "exam_id" does not exist**
- Ensure the entire script runs without stopping
- The table creation must complete before the RLS policies are created

**Error: relation "exams" does not exist**
- This means the exams table wasn't created
- Run the script again from the beginning
- Check for any error messages during execution

**Error: policy already exists**
- This is safe and happens when re-running the script
- The script will drop and recreate policies automatically

## Support

For setup instructions, see: `/EXAMS_SETUP.md`
For feature documentation, see: `/SPECIAL_EXAMS_FEATURE.md`
