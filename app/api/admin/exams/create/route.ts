import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateObject, generateText } from 'ai'
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
      const jsonPrompt = `You are an expert exam creator. Generate exactly ${total_questions} educational exam questions in valid JSON format for the following:
Subject: ${subject}
Difficulty Level: ${difficulty_level}
Description: ${description || 'Professional certification exam'}

Requirements:
- Mix of question types (multiple_choice, true_false, short_answer)
- Appropriate difficulty level
- Each question should have clear correct answers
- Include explanations for each answer
- For multiple choice, provide exactly 4 options as: {"A": "option 1", "B": "option 2", "C": "option 3", "D": "option 4"}
- For true/false, options are: {"true": "True", "false": "False"}
- Make questions comprehensive and professional
- Each question difficulty should be easy, medium, or hard

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "questions": [
    {
      "question_text": "the question",
      "question_type": "multiple_choice" or "true_false" or "short_answer",
      "difficulty": "easy" or "medium" or "hard",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."} or null for short_answer,
      "correct_answer": "A" or "true" or "the answer text",
      "explanation": "why this is correct"
    }
  ]
}`

      console.log('[v0] Calling AI to generate questions...')
      let questionData: z.infer<typeof ExamQuestions>
      
      try {
        const result = await generateObject({
          model: 'xai/grok-2',
          schema: ExamQuestions,
          prompt: jsonPrompt,
          temperature: 0.7,
        })
        questionData = result.object
      } catch (structuredErr) {
        console.log('[v0] Grok structured generation failed, trying text generation:', structuredErr)
        
        // Fallback: use generateText and parse JSON manually
        const { text } = await generateText({
          model: 'xai/grok-2',
          prompt: jsonPrompt,
          temperature: 0.7,
        })
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Failed to extract JSON from Grok response')
        }
        
        questionData = JSON.parse(jsonMatch[0])
      }

      console.log('[v0] Received questions from Grok:', questionData?.questions?.length || 0)

      if (!questionData?.questions || questionData.questions.length === 0) {
        throw new Error('No questions were generated')
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

      console.log('[v0] Inserting questions to database...')
      const { error: questionsError } = await adminDb
        .from('exam_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('[v0] Questions insertion error:', questionsError)
        throw new Error(`Database insertion failed: ${questionsError.message}`)
      }

      // Update exam status to published
      await adminDb
        .from('exams')
        .update({ status: 'published' })
        .eq('id', exam.id)

      console.log('[v0] Exam published successfully')
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
      const errorMsg = aiError instanceof Error ? aiError.message : 'Unknown error'
      
      // Delete the exam if question generation fails
      try {
        await adminDb.from('exams').delete().eq('id', exam.id)
      } catch (deleteErr) {
        console.error('[v0] Failed to delete exam on error:', deleteErr)
      }
      
      return NextResponse.json({ error: `Failed to generate questions: ${errorMsg}` }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Exam creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
