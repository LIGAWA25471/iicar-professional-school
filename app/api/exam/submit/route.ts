import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { exam_id, token, respondent_name, respondent_email, answers, time_taken_seconds } = body

    if (!exam_id || !respondent_name || !respondent_email || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Verify exam exists and is accessible via token
    const { data: exam, error: examError } = await adminDb
      .from('exams')
      .select('id, passing_score')
      .eq('id', exam_id)
      .eq('share_token', token)
      .in('status', ['published', 'active', 'scheduled'])
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found or not accessible' }, { status: 404 })
    }

    // Get all questions with correct answers
    const { data: questions } = await adminDb
      .from('exam_questions')
      .select('id, correct_answer, marks')
      .eq('exam_id', exam_id)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for exam' }, { status: 400 })
    }

    // Calculate score
    let totalMarks = 0
    let obtainedMarks = 0

    questions.forEach((q) => {
      totalMarks += q.marks || 1
      const userAnswer = answers[q.id]?.toString().toLowerCase().trim()
      const correctAnswer = q.correct_answer.toLowerCase().trim()
      
      if (userAnswer === correctAnswer) {
        obtainedMarks += q.marks || 1
      }
    })

    const percentage = (obtainedMarks / totalMarks) * 100
    const passed = percentage >= exam.passing_score

    // Create attempt record
    const { data: attempt, error: attemptError } = await adminDb
      .from('exam_attempts')
      .insert({
        exam_id: exam_id,
        respondent_email,
        respondent_name,
        completed_at: new Date().toISOString(),
        score: parseFloat(percentage.toFixed(2)),
        passed,
        time_taken_seconds,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single()

    if (attemptError || !attempt) {
      console.error('[v0] Attempt creation error:', attemptError)
      return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
    }

    // Store question responses
    const responseRecords = questions.map((q) => {
      const userAnswer = answers[q.id]
      const isCorrect = userAnswer?.toString().toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
      
      return {
        attempt_id: attempt.id,
        question_id: q.id,
        answer_text: userAnswer || '',
        is_correct: isCorrect,
        marks_obtained: isCorrect ? (q.marks || 1) : 0,
      }
    })

    const { error: responseError } = await adminDb
      .from('exam_question_responses')
      .insert(responseRecords)

    if (responseError) {
      console.error('[v0] Response recording error:', responseError)
      return NextResponse.json({ error: 'Failed to record responses' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      score: percentage,
      passed,
      attempt_id: attempt.id,
    })
  } catch (error) {
    console.error('[v0] Exam submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
