import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const adminDb = createAdminClient()

    let enrollments: any[] = []

    if (search && search.trim().length > 0) {
      // Search by student name or email
      console.log('[v0] Searching for:', search)
      
      const { data: profiles, error: profilesError } = await adminDb
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', `%${search}%`)
        .limit(20)

      if (profilesError) {
        console.error('[v0] Profile search error:', profilesError.message)
        return NextResponse.json({ error: profilesError.message }, { status: 500 })
      }

      if (!profiles || profiles.length === 0) {
        return NextResponse.json([])
      }

      // Get enrollments for these profiles
      const studentIds = profiles.map(p => p.id)
      const { data: studentEnrollments, error: enrollError } = await adminDb
        .from('enrollments')
        .select('*')
        .in('student_id', studentIds)

      if (enrollError) {
        console.error('[v0] Enrollment fetch error:', enrollError.message)
        return NextResponse.json({ error: enrollError.message }, { status: 500 })
      }

      // Build result with profiles and their enrollments
      const result = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        enrollments: (studentEnrollments || [])
          .filter(e => e.student_id === profile.id)
          .map(e => ({ ...e }))
      }))

      console.log('[v0] Search results:', result.length, 'students with', studentEnrollments?.length || 0, 'enrollments')
      return NextResponse.json(result)
    } else {
      // Get all active and completed enrollments
      console.log('[v0] Fetching all enrollments')
      
      const { data: allEnrollments, error: enrollError } = await adminDb
        .from('enrollments')
        .select('*')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(200)

      if (enrollError) {
        console.error('[v0] Enrollments fetch error:', enrollError.message)
        return NextResponse.json({ error: enrollError.message }, { status: 500 })
      }

      if (!allEnrollments || allEnrollments.length === 0) {
        console.log('[v0] No enrollments found')
        return NextResponse.json([])
      }

      // Get unique student IDs
      const studentIds = [...new Set(allEnrollments.map(e => e.student_id))]
      
      // Fetch all student profiles
      const { data: profiles, error: profileError } = await adminDb
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)

      if (profileError) {
        console.error('[v0] Profiles fetch error:', profileError.message)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // Build result
      const result = (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        enrollments: (allEnrollments || [])
          .filter(e => e.student_id === profile.id)
          .map(e => ({ ...e }))
      }))

      console.log('[v0] Returning', result.length, 'students with enrollments')
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
