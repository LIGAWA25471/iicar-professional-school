import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import crypto from 'crypto'

const ExamQuestion = z.object({
  question_text: z.string().describe('The exam question'),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer']).describe('Type of question'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z.record(z.string()).optional().describe('For multiple choice: {A: "option", B: "option"}'),
  correct_answer: z.string().describe('The correct answer (A/B/C/D, true/false, or text)'),
  explanation: z.string().describe('Explanation of why this is correct'),
})

const ExamQuestions = z.object({
  questions: z.array(ExamQuestion).describe('Array of exam questions'),
})

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
    const { title, description, subject, difficulty_level, total_questions = 50, scheduled_date, duration_minutes = 60, passing_score = 70 } = body

    if (!title || !subject || !difficulty_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (total_questions < 50 || total_questions > 100) {
      return NextResponse.json({ error: 'Total questions must be between 50 and 100' }, { status: 400 })
    }

    // Generate unique share token
    const share_token = crypto.randomBytes(16).toString('hex')

    // Insert exam record first
    const { data: exam, error: examError } = await adminDb
      .from('exams')
      .insert({
        created_by: user.id,
        title,
        description,
        subject,
        difficulty_level,
        total_questions,
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

    // Generate AI questions
    console.log(`[v0] Generating ${total_questions} exam questions for "${title}"...`)

    const prompt = `You are an expert exam creator. Generate exactly ${total_questions} educational exam questions for the following:
Subject: ${subject}
Difficulty Level: ${difficulty_level}
Description: ${description || 'Professional certification exam'}

Requirements:
- Mix of question types (multiple choice, true/false, short answer)
- Appropriate difficulty level
- Each question should have clear correct answers
- Include explanations for each answer
- For multiple choice, provide 4 options (A, B, C, D)
- For true/false, options are true/false
- Make questions comprehensive and professional

Return the questions in the exact JSON format specified.`

    try {
      const { object: questionData } = await generateObject({
        model: 'grok-2-1212',
        schema: ExamQuestions,
        prompt,
      })

      if (!questionData.questions || questionData.questions.length === 0) {
        throw new Error('No questions generated')
      }

      // Insert questions
      const questionsToInsert = questionData.questions.slice(0, total_questions).map((q, index) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        question_type: q.question_type,
        difficulty: q.difficulty,
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        marks: 1,
        order_position: index + 1,
      }))

      const { error: questionsError } = await adminDb
        .from('exam_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('[v0] Questions insertion error:', questionsError)
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
          question_count: questionData.questions.length,
        },
      })
    } catch (aiError) {
      console.error('[v0] AI question generation error:', aiError)
      // Delete the exam if question generation fails
      await adminDb.from('exams').delete().eq('id', exam.id)
      return NextResponse.json({ error: 'Failed to generate questions with AI' }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Exam creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
