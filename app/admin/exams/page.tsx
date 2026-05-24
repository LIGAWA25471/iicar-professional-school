import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ExamsTable from '@/components/admin/exams-table'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  // Verify admin
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) redirect('/dashboard')

  // Fetch all exams created by this admin
  const { data: exams, error: examsError } = await adminDb
    .from('exams')
    .select('id, title, subject, difficulty_level, total_questions, status, scheduled_date, created_at, share_token')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Special Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage AI-generated exams</p>
        </div>
        <Button asChild>
          <Link href="/admin/exams/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create New Exam
          </Link>
        </Button>
      </div>

      {examsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 font-semibold text-amber-900">Database Setup Required</h2>
          <p className="mb-4 text-sm text-amber-800">
            The exams table hasn&apos;t been created yet. Please follow these steps to set up the database:
          </p>
          <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-amber-800">
            <li>Visit your Supabase Dashboard SQL Editor</li>
            <li>Copy all SQL from the file: <code className="rounded bg-white px-2 py-1 font-mono">/EXAMS_SETUP.md</code></li>
            <li>Paste it into the SQL Editor and click Run</li>
            <li>Refresh this page once complete</li>
          </ol>
          <a 
            href="https://app.supabase.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Open Supabase Dashboard →
          </a>
          <p className="mt-4 text-xs text-amber-700">
            Error details: {examsError.message}
          </p>
        </div>
      )}

      {!examsError && (
        <ExamsTable exams={exams || []} />
      )}
    </div>
  )
}
