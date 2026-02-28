import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programId, moduleId, answers, type } = await request.json()

  // Fetch questions with correct answers (server-side only)
  let query = supabase
    .from('questions')
    .select('id, correct_answer, question_type')
    .eq('question_type', type)

  if (type === 'module_quiz' && moduleId) {
    query = query.eq('module_id', moduleId)
  } else {
    query = query.eq('program_id', programId)
  }

  const { data: questions } = await query
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 400 })
  }

  let correct = 0
  for (const q of questions) {
    if (answers[q.id] === q.correct_answer) correct++
  }
  const score = Math.round((correct / questions.length) * 100)

  const { data: program } = await supabase
    .from('programs')
    .select('passing_score, max_attempts')
    .eq('id', programId)
    .single()

  const passingScore = program?.passing_score ?? 70
  const passed = score >= passingScore

  // Record attempt
  await supabase.from('exam_attempts').insert({
    student_id: user.id,
    program_id: programId,
    module_id: moduleId ?? null,
    attempt_type: type,
    score,
    passed,
    answers,
  })

  // If final exam passed: issue certificate + complete enrollment
  if (type === 'final_exam' && passed) {
    const certId = `IICAR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    await supabase.from('certificates').upsert({
      student_id: user.id,
      program_id: programId,
      cert_id: certId,
      final_score: score,
      issued_at: new Date().toISOString(),
    }, { onConflict: 'student_id,program_id' })

    await supabase.from('enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('student_id', user.id)
      .eq('program_id', programId)
  }

  return NextResponse.json({ score, passed })
}
