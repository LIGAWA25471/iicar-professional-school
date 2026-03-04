import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  // Use admin client to bypass RLS — enrollment check still scoped to user.id
  const adminDb = createAdminClient()

  const { data: enrollment } = await adminDb
    .from('enrollments')
    .select('status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()
  if (!enrollment || enrollment.status !== 'active') redirect(`/dashboard/programs/${programId}`)

  // Fetch program + questions — bypasses RLS on questions table

  const { data: program } = await adminDb
    .from('programs')
    .select('id, title, passing_score, max_attempts')
    .eq('id', programId)
    .single()
  if (!program) notFound()

  const { data: questions } = await adminDb
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
  const passedAttempt = passed ? attempts?.find(a => a.passed) : null

  if (passed && passedAttempt) {
    return (
      <div className="max-w-2xl flex flex-col gap-6 py-16 mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Award className="h-9 w-9 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Congratulations!</h2>
          <p className="text-muted-foreground mb-1">You have successfully completed the final exam</p>
          <p className="text-sm text-muted-foreground font-mono">{passedAttempt.score}% — Passed</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base font-semibold">
            <Link href={`/dashboard/certificates`}>View Your Certificate</Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-11 text-base font-semibold">
            <Link href={`/dashboard/programs/${programId}`}>Back to Program</Link>
          </Button>
        </div>
      </div>
    )
  }
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
