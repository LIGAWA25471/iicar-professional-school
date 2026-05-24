import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Exam tables setup required',
    instructions: `Please run the following SQL in Supabase SQL Editor (https://app.supabase.com/project/_/sql/new):

1. Copy the entire content from: /lib/supabase/migrations/create_exams_tables.sql
2. Paste it into the SQL Editor
3. Click "Run"
4. Once complete, refresh the exams page

The migration file contains all necessary table creation, indexes, and RLS policies.
    `
  }, { status: 200 })
}
