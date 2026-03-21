import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const certId = request.nextUrl.searchParams.get('id')
    
    if (!certId) {
      return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
    }

    console.log('[v0] Verifying certificate:', certId)

    const adminDb = createAdminClient()
    
    // Query certificate - use array response instead of .single()
    const { data: certificates, error } = await adminDb
      .from('certificates')
      .select('cert_id, issued_at, final_score, revoked, certificate_level, student_id, program_id, profiles(full_name, country), programs(title)')
      .eq('cert_id', certId.trim().toUpperCase())

    if (error) {
      console.error('[v0] Certificate query error:', error)
      return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 })
    }

    if (!certificates || certificates.length === 0) {
      console.log('[v0] Certificate not found:', certId)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const cert = certificates[0]

    // Check if certificate is issued
    if (!cert.issued_at) {
      console.log('[v0] Certificate not yet issued:', certId)
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    console.log('[v0] Certificate verified successfully:', certId)

    return NextResponse.json({
      cert_id: cert.cert_id,
      issued_at: cert.issued_at,
      final_score: cert.final_score,
      revoked: cert.revoked,
      certificate_level: cert.certificate_level,
      profiles: cert.profiles,
      programs: cert.programs,
    })
  } catch (err) {
    console.error('[v0] Verify certificate error:', err)
    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 })
  }
}
