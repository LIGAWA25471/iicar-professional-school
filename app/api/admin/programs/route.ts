import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const { modules, ...programData } = body

    // Insert program
    const { data: program, error: progError } = await adminDb
      .from('programs')
      .insert({
        title: programData.title,
        description: programData.description,
        level: programData.level,
        duration_weeks: Number(programData.duration_weeks),
        price_cents: Number(programData.price_cents),
        passing_score: Number(programData.passing_score),
        is_published: Boolean(programData.is_published),
      })
      .select('id')
      .single()

    if (progError) throw progError

    // Insert modules if provided, using the correct 'modules' table and schema
    if (modules && modules.length > 0) {
      const moduleRows = modules.map((m: {
        module_number: number
        title: string
        description: string
        learning_outcomes: string[]
        duration_hours: number
        topics: string[]
      }) => ({
        program_id: program.id,
        title: m.title,
        description: JSON.stringify({
          summary: m.description,
          topics: m.topics ?? [],
          learning_outcomes: m.learning_outcomes ?? [],
          duration_hours: m.duration_hours ?? 0,
        }),
        sort_order: m.module_number,
      }))

      const { error: modError } = await adminDb.from('modules').insert(moduleRows)
      if (modError) console.error('[v0] module insert error (non-fatal):', modError.message)
    }

    return NextResponse.json({ id: program.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
