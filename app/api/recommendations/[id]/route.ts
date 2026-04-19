import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'No recommendation ID provided' }, { status: 400 })

  try {
    const adminDb = createAdminClient()

    // Fetch recommendation record
    const { data: recommendation, error } = await adminDb
      .from('recommendations')
      .select(`
        id,
        student_id,
        program_id,
        recommendation_type,
        language,
        generated_at,
        profiles:student_id(full_name),
        programs(title)
      `)
      .eq('id', id)
      .single()

    if (error || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Check if recommendation is public (can be viewed by anyone with the ID)
    return NextResponse.json({
      id: recommendation.id,
      studentName: recommendation.profiles?.full_name,
      programTitle: recommendation.programs?.title,
      type: recommendation.recommendation_type,
      language: recommendation.language,
      generatedAt: recommendation.generated_at,
    })
  } catch (error) {
    console.error('[v0] Recommendation fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 })
  }
}
