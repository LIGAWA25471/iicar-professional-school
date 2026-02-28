import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuizEngine from '@/components/quiz-engine'

export default async function FinalExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: programId } = await params
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

  const { data: program } = await supabase
    .from('programs')
    .select('id, title, passing_score, max_attempts')
    .eq('id', programId)
    .single()
  if (!program) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d')
    .eq('program_id', programId)
    .eq('question_type', 'final_exam')

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">The final exam is not ready yet. Check back soon.</p>
      </div>
    )
  }

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('id, score, passed, submitted_at')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .eq('attempt_type', 'final_exam')
    .order('submitted_at', { ascending: false })

  const attemptsUsed = attempts?.length ?? 0
  const passed = attempts?.some(a => a.passed)

  if (passed) redirect(`/dashboard/programs/${programId}`)
  if (attemptsUsed >= program.max_attempts && !passed) {
    return (
      <div className="max-w-2xl flex flex-col gap-4 py-20 text-center mx-auto">
        <h2 className="text-xl font-bold text-destructive">Maximum Attempts Reached</h2>
        <p className="text-muted-foreground text-sm">You have used all {program.max_attempts} attempts. Please contact your administrator.</p>
      </div>
    )
  }

  return (
    <QuizEngine
      programId={programId}
      moduleId={null}
      moduleTitle={`${program.title} — Final Exam`}
      questions={questions}
      attempts={attempts ?? []}
      type="final_exam"
      passingScore={program.passing_score}
    />
  )
}
