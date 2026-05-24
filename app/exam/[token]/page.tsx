import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ExamTaker from '@/components/exam-taker'

export default async function ExamPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  
  const adminDb = createAdminClient()

  // Fetch exam by share token
  const { data: exam, error } = await adminDb
    .from('exams')
    .select('id, title, description, duration_minutes, passing_score, subject, difficulty_level')
    .eq('share_token', token)
    .in('status', ['published', 'active', 'scheduled'])
    .single()

  if (error || !exam) {
    notFound()
  }

  // Fetch questions for this exam
  const { data: questions } = await adminDb
    .from('exam_questions')
    .select('id, question_text, question_type, options, difficulty')
    .eq('exam_id', exam.id)
    .order('order_position', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <ExamTaker exam={exam} questions={questions || []} token={token} />
    </div>
  )
}
