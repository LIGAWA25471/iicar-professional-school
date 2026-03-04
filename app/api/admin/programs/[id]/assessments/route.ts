import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()

  // Verify admin
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { moduleId, questions, type } = await request.json()
  // type: 'module_quiz' | 'final_exam'
  if (!questions?.length) return NextResponse.json({ error: 'No questions provided' }, { status: 400 })

  console.log('[v0] Saving assessment:', { moduleId, programId, type, questionCount: questions.length })

  // Delete existing questions for this module/program+type so we don't duplicate
  if (type === 'module_quiz' && moduleId) {
    await adminDb.from('questions').delete()
      .eq('module_id', moduleId)
      .eq('question_type', 'module_quiz')
  } else if (type === 'final_exam') {
    await adminDb.from('questions').delete()
      .eq('program_id', programId)
      .eq('question_type', 'final_exam')
  }

  // Map AI-generated questions to DB format
  // AI returns: { question, options: [a,b,c,d], correct_answer: 0|1|2|3, explanation }
  const rows = questions.map((q: {
    question: string
    options: string[]
    correct_answer: number
    explanation?: string
  }) => ({
    program_id:    programId,
    module_id:     type === 'module_quiz' ? moduleId : null,
    question_text: q.question,
    option_a:      q.options[0] ?? '',
    option_b:      q.options[1] ?? '',
    option_c:      q.options[2] ?? '',
    option_d:      q.options[3] ?? '',
    correct_answer: ['a', 'b', 'c', 'd'][q.correct_answer] ?? 'a',
    question_type: type ?? 'module_quiz',
  }))

  console.log('[v0] Mapped rows sample:', rows[0])

  const { error, data } = await adminDb.from('questions').insert(rows)
  if (error) {
    console.error('[v0] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[v0] Successfully saved', rows.length, 'questions')
  return NextResponse.json({ success: true, saved: rows.length })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId')
  const type = searchParams.get('type') ?? 'module_quiz'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let query = adminDb.from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_type')
    .eq('program_id', programId)
    .eq('question_type', type)

  if (type === 'module_quiz' && moduleId) {
    query = query.eq('module_id', moduleId)
  }

  const { data: questions, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ questions: questions ?? [] })
}
