import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Verify user is admin
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get enrollments for the student
    const { data: enrollments, error } = await adminDb
      .from('enrollments')
      .select('id, status, program_id, programs(title)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching enrollments:', error)
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    return NextResponse.json(enrollments || [])
  } catch (err) {
    console.error('[v0] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
