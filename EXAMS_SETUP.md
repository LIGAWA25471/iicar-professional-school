# Special Exams - Database Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Get the SQL Script
The SQL migration script is located at:
```
/scripts/db/01_create_exams_tables.sql
```

### Step 2: Open Supabase SQL Editor
1. Go to https://app.supabase.com/
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 3: Copy and Paste
1. Open the file: `scripts/db/01_create_exams_tables.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor

### Step 4: Run the Script
1. Click the blue **Run** button
2. Wait for completion (should take 10-30 seconds)
3. You'll see a success message when done

### Step 5: Verify Setup
1. Return to your application
2. Go to Admin → Special Exams
3. The setup message should disappear
4. You can now create exams!

## What Gets Created

The script creates 4 tables with proper indexes and RLS policies:

- **exams** - Exam metadata and settings
- **exam_questions** - Individual questions (AI-generated)
- **exam_attempts** - Student submissions and scores
- **exam_question_responses** - Individual answer tracking

## Troubleshooting

### Still seeing the error after setup?
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check that the SQL ran without errors
- Make sure you ran the entire script

### SQL errors during execution?
- Make sure the script is the complete version from `scripts/db/01_create_exams_tables.sql`
- Do not edit the SQL before running
- If you get a "table already exists" error, that's fine - it means partial tables exist

### Can't find the script?
- The script is located in: `scripts/db/01_create_exams_tables.sql`
- If migrating from the old setup, use this script instead

## Support

For questions about the Special Exams feature:
- See: SPECIAL_EXAMS_FEATURE.md
- Database schema: scripts/db/01_create_exams_tables.sql
