import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamCreateForm from '@/components/admin/exam-create-form'

export default async function CreateExamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Exam</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure exam settings and AI will generate 50-100 questions automatically
        </p>
      </div>

      <div className="max-w-2xl">
        <ExamCreateForm />
      </div>
    </div>
  )
}
