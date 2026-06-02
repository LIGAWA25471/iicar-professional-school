import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { exam_id, token, respondent_name, respondent_email, answers, time_taken_seconds } = body

    // Validation
    if (!exam_id || !respondent_name || !respondent_email) {
      return NextResponse.json({ error: 'Missing required fields: exam_id, respondent_name, or respondent_email' }, { status: 400 })
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided. Please answer at least one question.' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(respondent_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    console.log('[v0] Processing exam submission:', { exam_id, respondent_email, answer_count: Object.keys(answers).length })

    const adminDb = createAdminClient()

    // Verify exam exists and is accessible via token
    const { data: exam, error: examError } = await adminDb
      .from('exams')
      .select('id, passing_score, share_token')
      .eq('id', exam_id)
      .single()

    if (examError || !exam) {
      console.error('[v0] Exam not found:', examError)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Verify share token matches
    if (exam.share_token !== token) {
      console.error('[v0] Invalid share token')
      return NextResponse.json({ error: 'Invalid or expired exam link' }, { status: 403 })
    }

    // Get all questions with correct answers
    const { data: questions, error: questionsError } = await adminDb
      .from('exam_questions')
      .select('id, correct_answer, marks, question_type')
      .eq('exam_id', exam_id)

    if (questionsError || !questions || questions.length === 0) {
      console.error('[v0] Questions retrieval error:', questionsError)
      return NextResponse.json({ error: 'Exam questions not found' }, { status: 400 })
    }

    // Calculate score
    let totalMarks = 0
    let obtainedMarks = 0
    const questionScores: Record<string, boolean> = {}

    questions.forEach((q) => {
      totalMarks += q.marks || 1
      const userAnswer = answers[q.id]?.toString().toLowerCase().trim()
      const correctAnswer = q.correct_answer.toLowerCase().trim()
      
      const isCorrect = userAnswer === correctAnswer
      questionScores[q.id] = isCorrect
      
      if (isCorrect) {
        obtainedMarks += q.marks || 1
      }
    })

    const percentage = (obtainedMarks / totalMarks) * 100
    const passed = percentage >= exam.passing_score

    console.log('[v0] Score calculated:', { obtainedMarks, totalMarks, percentage, passed })

    // Create attempt record with retry logic
    let attempt = null
    let attemptError = null
    let retries = 3

    while (retries > 0) {
      const { data: attemptData, error: err } = await adminDb
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

      if (!err && attemptData) {
        attempt = attemptData
        break
      }

      attemptError = err
      retries--
      if (retries > 0) {
        console.log(`[v0] Attempt creation retry (${4 - retries}/3)...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (attemptError || !attempt) {
      console.error('[v0] Attempt creation failed after retries:', attemptError)
      
      // Check if it's a database constraint issue
      const errorStr = attemptError?.message || ''
      if (errorStr.includes('constraint') || errorStr.includes('CONSTRAINT')) {
        return NextResponse.json({ 
          error: 'Database validation failed. Please check your email and try again.',
          details: 'A required field may be missing or invalid.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to save exam attempt. Please try again or contact support.',
        details: attemptError?.message,
        errorCode: 'ATTEMPT_CREATION_FAILED'
      }, { status: 500 })
    }

    // Store question responses with bulk insert
    const responseRecords = questions.map((q) => {
      const userAnswer = answers[q.id]
      const isCorrect = questionScores[q.id]
      
      return {
        attempt_id: attempt.id,
        question_id: q.id,
        answer_text: userAnswer || '',
        is_correct: isCorrect,
        marks_obtained: isCorrect ? (q.marks || 1) : 0,
      }
    })

    const { error: responseError, data: responses } = await adminDb
      .from('exam_question_responses')
      .insert(responseRecords)
      .select()

    if (responseError) {
      console.error('[v0] Response recording error:', responseError)
      // Still return success since attempt was recorded
      return NextResponse.json({
        success: true,
        score: percentage,
        passed,
        attempt_id: attempt.id,
        warning: 'Exam submitted but some response details may not have been saved'
      })
    }

    console.log('[v0] Exam submission successful:', { attempt_id: attempt.id, score: percentage })

    return NextResponse.json({
      success: true,
      score: percentage,
      passed,
      attempt_id: attempt.id,
      message: `Exam submitted successfully. You scored ${percentage.toFixed(2)}%`
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[v0] Exam submission error:', { message: errorMsg, stack: errorStack })
    
    // Return more detailed error for debugging
    return NextResponse.json({ 
      error: 'Server error processing your submission. Please try again.',
      details: errorMsg,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
