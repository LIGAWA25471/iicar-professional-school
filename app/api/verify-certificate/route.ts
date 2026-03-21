import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const certId = request.nextUrl.searchParams.get('id')
    if (!certId) {
      return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
    }

    const trimmedCertId = certId.trim().toUpperCase()
    console.log('[v0] Verifying certificate:', { originalId: certId, trimmedId: trimmedCertId })

    const adminDb = createAdminClient()
    
    // Try with exact match first
    const { data: certificates, error, status } = await adminDb
      .from('certificates')
      .select('cert_id, issued_at, final_score, revoked, certificate_level, student_id, program_id, profiles(full_name, country), programs(title)')
      .ilike('cert_id', trimmedCertId)

    console.log('[v0] Query result:', { 
      status, 
      error: error?.message, 
      found: certificates?.length,
      certificates: certificates?.map((c: any) => c.cert_id)
    })

    if (error) {
      console.error('[v0] Certificate query error:', error.message)
      return NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 })
    }

    if (!certificates || certificates.length === 0) {
      console.log('[v0] Certificate not found for:', trimmedCertId)
      return NextResponse.json({ error: 'Certificate not found', searched: trimmedCertId }, { status: 404 })
    }

    const data = certificates[0]

    if (!data.issued_at) {
      console.log('[v0] Certificate not yet issued:', trimmedCertId)
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    console.log('[v0] Certificate verified successfully:', trimmedCertId)

    return NextResponse.json({
      cert_id: data.cert_id,
      issued_at: data.issued_at,
      final_score: data.final_score,
      revoked: data.revoked,
      certificate_level: data.certificate_level,
      profiles: data.profiles,
      programs: data.programs,
    })
  } catch (err) {
    console.error('[v0] Verify certificate error:', err)
    return NextResponse.json({ error: 'Server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
