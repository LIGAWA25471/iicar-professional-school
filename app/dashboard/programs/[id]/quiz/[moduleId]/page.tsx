import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuizEngine from '@/components/quiz-engine'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: programId, moduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()
  if (!enrollment || enrollment.status !== 'active') redirect(`/dashboard/programs/${programId}`)

  const { data: module_ } = await supabase
    .from('modules')
    .select('id, title')
    .eq('id', moduleId)
    .single()
  if (!module_) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d')
    .eq('module_id', moduleId)
    .eq('question_type', 'module_quiz')
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">No quiz questions for this module yet.</p>
      </div>
    )
  }

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('id, score, passed, submitted_at')
    .eq('student_id', user.id)
    .eq('module_id', moduleId)
    .eq('attempt_type', 'module_quiz')
    .order('submitted_at', { ascending: false })

  return (
    <QuizEngine
      programId={programId}
      moduleId={moduleId}
      moduleTitle={module_.title}
      questions={questions}
      attempts={attempts ?? []}
      type="module_quiz"
    />
  )
}
