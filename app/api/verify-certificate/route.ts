import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const certId = request.nextUrl.searchParams.get('id')
  if (!certId) {
    return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
  }

  const adminDb = createAdminClient()
  
  const { data, error } = await adminDb
    .from('certificates')
    .select('cert_id, issued_at, final_score, revoked, student_id, profiles(full_name, country), programs(title, level)')
    .eq('cert_id', certId.trim().toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
