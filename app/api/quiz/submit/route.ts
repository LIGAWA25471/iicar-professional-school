import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function sendExamNotification(email: string, studentName: string, programTitle: string, score: number) {
  try {
    console.log('[v0] Sending exam completion email to:', email)
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/email/exam-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, studentName, programTitle, score }),
    })
    const data = await res.json()
    console.log('[v0] Exam notification response:', { status: res.status, data })
  } catch (err) {
    console.error('[v0] Failed to send exam notification:', err)
  }
}

async function sendCertificateNotification(email: string, studentName: string, programTitle: string, certificatePdfUrl: string) {
  try {
    console.log('[v0] Sending certificate email to:', email)
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/email/certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, studentName, programTitle, certificatePdfUrl }),
    })
    const data = await res.json()
    console.log('[v0] Certificate notification response:', { status: res.status, data })
  } catch (err) {
    console.error('[v0] Failed to send certificate notification:', err)
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programId, moduleId, answers, type } = await request.json()

  // Use admin client to fetch questions — bypasses RLS so correct_answer is never exposed to the client
  const adminDb = createAdminClient()

  let query = adminDb
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

  const { data: program } = await adminDb
    .from('programs')
    .select('passing_score, max_attempts')
    .eq('id', programId)
    .single()

  const passingScore = program?.passing_score ?? 70
  const passed = score >= passingScore

  // Fetch student info for emails
  const { data: studentProfile } = await adminDb
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Record attempt via user-scoped client (RLS: student_id = auth.uid())
  await supabase.from('exam_attempts').insert({
    student_id: user.id,
    program_id: programId,
    module_id: moduleId ?? null,
    attempt_type: type,
    score,
    passed,
    answers,
  })

  // If final exam: send completion email
  if (type === 'final_exam' && studentProfile) {
    const programTitle = (await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single()).data?.title || 'Program'
    
    await sendExamNotification(
      studentProfile.email || user.email || '',
      studentProfile.full_name || 'Student',
      programTitle,
      score
    )
  }

  // If final exam passed: create certificate request (admin can then sign and issue)
  if (type === 'final_exam' && passed) {
    const certId = `IICAR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Create certificate - set issued_at to null initially so admin knows it needs approval
    // We'll use issued_at as the approval flag: if null, it's pending; if set, it's approved
    await adminDb.from('certificates').upsert({
      student_id: user.id,
      program_id: programId,
      cert_id: certId,
      final_score: score,
      issued_at: null, // Null = pending approval
      revoked: false,
    }, { onConflict: 'student_id,program_id' })

    // Update enrollment to completed status
    await adminDb.from('enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('student_id', user.id)
      .eq('program_id', programId)

    console.log('[v0] Certificate created for student:', user.id, 'program:', programId, 'score:', score)
  }

  return NextResponse.json({ score, passed, pendingApproval: type === 'final_exam' && passed })
}
