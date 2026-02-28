import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { modules } = await request.json()
    if (!Array.isArray(modules)) return NextResponse.json({ error: 'modules must be an array' }, { status: 400 })

    // Delete existing modules for this program, then re-insert
    await adminDb.from('modules').delete().eq('program_id', programId)

    const rows = modules.map((m: {
      module_number: number
      title: string
      description: string
      learning_outcomes: string[]
      duration_hours: number
      topics: string[]
      content?: object | null
    }) => ({
      program_id: programId,
      title: m.title,
      // Encode all AI-generated data as JSON in the description column
      description: JSON.stringify({
        summary: m.description,
        topics: m.topics ?? [],
        learning_outcomes: m.learning_outcomes ?? [],
        duration_hours: m.duration_hours ?? 0,
        content: m.content ?? null,
      }),
      sort_order: m.module_number,
    }))

    const { data, error } = await adminDb.from('modules').insert(rows).select('id')
    if (error) throw error

    return NextResponse.json({ saved: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
