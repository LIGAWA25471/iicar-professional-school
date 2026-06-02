import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const exam_id = searchParams.get('exam_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!exam_id) {
      return NextResponse.json({ error: 'exam_id parameter required' }, { status: 400 })
    }

    // Verify exam exists (any admin can view attempts)
    const { data: exam, error: examError } = await adminDb
      .from('exams')
      .select('id')
      .eq('id', exam_id)
      .single()

    if (examError || !exam) {
      console.error('[v0] Exam not found:', examError)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get attempts for this exam with pagination
    // Try to select respondent_name, fall back if column doesn't exist
    let attempts = null
    let totalCount = 0
    let attemptsError = null

    const { data: attemptsData, count, error: err1 } = await adminDb
      .from('exam_attempts')
      .select('id, respondent_email, score, passed, started_at, completed_at, time_taken_seconds', { count: 'exact' })
      .eq('exam_id', exam_id)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (err1) {
      console.error('[v0] Attempts retrieval error:', err1)
      return NextResponse.json({ error: 'Failed to fetch attempts', details: err1.message }, { status: 500 })
    }

    attempts = attemptsData || []
    totalCount = count || 0

    // Get summary statistics from the attempts data we already have
    const stats = {
      total_submissions: totalCount || 0,
      average_score: attempts && attempts.length > 0 
        ? parseFloat((attempts.reduce((sum: any, a: any) => sum + (a.score || 0), 0) / attempts.length).toFixed(2))
        : 0,
      pass_count: attempts?.filter((a: any) => a.passed).length || 0,
      pass_rate: attempts && attempts.length > 0
        ? parseFloat(((attempts.filter((a: any) => a.passed).length / attempts.length) * 100).toFixed(2))
        : 0,
    }

    return NextResponse.json({
      attempts: attempts || [],
      stats,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (offset + limit) < (totalCount || 0)
      }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Attempts API error:', {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMsg
    }, { status: 500 })
  }
}
