# Exam Database Setup

## Required: Run the Database Migration

The special exams feature requires several database tables. If you're seeing errors like `column exam_attempts.respondent_name does not exist`, you need to run the migration.

### How to Run the Migration

1. **Open Supabase Console**
   - Go to [supabase.com](https://supabase.com)
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Create a New Query**
   - Click "New Query"
   - Copy the entire content from: `/scripts/db/01_create_exams_tables.sql`

3. **Run the Migration**
   - Paste the SQL code into the editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for confirmation message

4. **Verify Tables Were Created**
   - Go to "Database" → "Tables" in Supabase
   - You should see:
     - `exams`
     - `exam_questions`
     - `exam_attempts`
     - `exam_question_responses`

## What the Migration Creates

### Tables
- **exams** - Main exam configuration and metadata
- **exam_questions** - Questions for each exam
- **exam_attempts** - Student submissions and scores
- **exam_question_responses** - Individual answer records

### Indexes
- Fast queries on exam_id, respondent, and share tokens

### Security
- Row Level Security (RLS) policies
- Admin-only access for exam creation
- Student access to their own attempts
- Public access for published exams

### Triggers
- Automatic timestamp updates

## If Migration Fails

**Error: "relation 'exams' already exists"**
- This is fine - the migration uses `IF NOT EXISTS`
- Just run it again, it will skip existing objects

**Error: "relation 'profiles' does not exist"**
- The exams table references the profiles table (for user management)
- Make sure your auth system is set up first
- If you don't have a profiles table, create one:
  ```sql
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    is_admin BOOLEAN DEFAULT FALSE
  );
  ```

**Error: Other column/table errors**
- Check if the migration ran partially
- Drop and recreate the tables:
  ```sql
  DROP TABLE IF EXISTS exam_question_responses;
  DROP TABLE IF EXISTS exam_attempts;
  DROP TABLE IF EXISTS exam_questions;
  DROP TABLE IF EXISTS exams;
  ```
- Then run the full migration again

## Verification

After running the migration, test that everything works:

1. Create a test exam in Admin → Special Exams
2. Check Supabase → SQL Editor:
   ```sql
   SELECT COUNT(*) FROM exams;
   ```
   Should return at least 1

3. Take the exam and submit it
4. Check if submission appears:
   ```sql
   SELECT * FROM exam_attempts ORDER BY created_at DESC LIMIT 5;
   ```

## Support

If you continue getting database errors:
1. Check the full error message in browser console (F12)
2. Note the exact column/table that's missing
3. Verify the migration ran completely
4. Check that your Supabase project uses PostgreSQL (not Postgres extension)
