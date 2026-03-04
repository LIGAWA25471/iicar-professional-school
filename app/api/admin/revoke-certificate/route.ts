import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { certId } = await request.json()
    if (!certId) return NextResponse.json({ error: 'No certificate ID' }, { status: 400 })

    console.log('[v0] Revoking certificate:', certId)

    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('certificates')
      .update({ revoked: true })
      .eq('id', certId)

    if (error) {
      console.error('[v0] Revoke error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[v0] Certificate revoked successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[v0] Revoke certificate error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
