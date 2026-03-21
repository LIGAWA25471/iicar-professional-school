import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('id')

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: student, error } = await adminDb
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', studentId)
      .single()

    if (error || !student) {
      console.log('[v0] Student check - not found:', studentId, error?.message)
      return NextResponse.json({ exists: false, error: error?.message }, { status: 404 })
    }

    console.log('[v0] Student check - found:', studentId)
    return NextResponse.json({ exists: true, student })
  } catch (err) {
    console.error('[v0] Student check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
