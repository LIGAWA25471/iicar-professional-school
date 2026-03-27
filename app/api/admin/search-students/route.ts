import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')

    const adminDb = createAdminClient()

    let query = adminDb
      .from('profiles')
      .select('id, full_name, country')
      .eq('is_admin', false)
      .limit(100)

    // If search query provided, filter by it
    if (q && q.length >= 2) {
      const searchTerm = `%${q}%`
      query = query.or(`full_name.ilike.${searchTerm},id.ilike.${searchTerm}`)
    }

    query = query.order('full_name', { ascending: true })

    const { data: students, error } = await query

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
