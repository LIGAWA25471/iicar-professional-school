import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')
    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const adminDb = createAdminClient()
    const searchTerm = `%${q}%`

    const { data: students, error } = await adminDb
      .from('profiles')
      .select('id, full_name, country')
      .eq('is_admin', false)
      .or(`full_name.ilike.${searchTerm},id.ilike.${searchTerm}`)
      .limit(10)

    if (error) {
      console.error('[v0] Search error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(students || [])
  } catch (err) {
    console.error('[v0] Search students error:', err)
    return NextResponse.json([])
  }
}
