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
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          Error loading exams: {examsError.message}
        </div>
      )}

      {!examsError && (
        <ExamsTable exams={exams || []} />
      )}
    </div>
  )
}
