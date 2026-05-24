import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    // Verify admin
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { title, description, subject, difficulty_level, scheduled_date, duration_minutes = 60, passing_score = 70, questions } = body

    if (!title || !subject || !difficulty_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    if (questions.length < 50 || questions.length > 100) {
      return NextResponse.json({ error: 'Total questions must be between 50 and 100' }, { status: 400 })
    }

    // Validate all questions have required fields
    const allValid = questions.every((q: any) => 
      q.question_text && 
      q.question_type && 
      q.correct_answer && 
      q.explanation && 
      q.difficulty
    )

    if (!allValid) {
      return NextResponse.json({ error: 'All questions must have: question_text, question_type, correct_answer, explanation, difficulty' }, { status: 400 })
    }

    // Generate unique share token
    const share_token = crypto.randomBytes(16).toString('hex')

    // Insert exam record
    const { data: exam, error: examError } = await adminDb
      .from('exams')
      .insert({
        created_by: user.id,
        title,
        description,
        subject,
        difficulty_level,
        total_questions: questions.length,
        scheduled_date: scheduled_date ? new Date(scheduled_date).toISOString() : null,
        duration_minutes,
        passing_score,
        share_token,
        status: 'draft',
      })
      .select()
      .single()

    if (examError || !exam) {
      console.error('[v0] Exam creation error:', examError)
      return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
    }

    // Insert questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      marks: q.marks || 1,
      order_position: index + 1,
    }))

    const { error: questionsError } = await adminDb
      .from('exam_questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('[v0] Questions insertion error:', questionsError)
      // Delete the exam if question insertion fails
      await adminDb.from('exams').delete().eq('id', exam.id)
      return NextResponse.json({ error: 'Failed to insert questions' }, { status: 500 })
    }

    // Update exam status to published
    await adminDb
      .from('exams')
      .update({ status: 'published' })
      .eq('id', exam.id)

    return NextResponse.json({
      exam: {
        ...exam,
        status: 'published',
        share_token,
        question_count: questions.length,
      },
    })
  } catch (error) {
    console.error('[v0] Manual exam creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
