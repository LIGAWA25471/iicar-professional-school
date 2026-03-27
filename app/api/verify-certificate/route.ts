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
    
    // Query certificates table first without relations
    const { data: certificates, error } = await adminDb
      .from('certificates')
      .select('*')
      .ilike('cert_id', trimmedCertId)

    console.log('[v0] Certificate query result:', { 
      error: error?.message, 
      found: certificates?.length,
      certificates: certificates?.map((c: any) => ({ id: c.id, cert_id: c.cert_id, student_id: c.student_id, program_id: c.program_id }))
    })

    if (error) {
      console.error('[v0] Certificate query error:', error.message)
      return NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 })
    }

    if (!certificates || certificates.length === 0) {
      console.log('[v0] Certificate not found for:', trimmedCertId)
      return NextResponse.json({ error: 'Certificate not found', searched: trimmedCertId }, { status: 404 })
    }

    const cert = certificates[0]

    if (!cert.issued_at) {
      console.log('[v0] Certificate not yet issued:', trimmedCertId)
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    // Fetch profile data separately
    let profile = null
    if (cert.student_id) {
      const { data: profiles } = await adminDb
        .from('profiles')
        .select('full_name, country')
        .eq('id', cert.student_id)
      
      profile = profiles && profiles.length > 0 ? profiles[0] : null
    }

    // Fetch program data separately
    let program = null
    if (cert.program_id) {
      const { data: programs } = await adminDb
        .from('programs')
        .select('title')
        .eq('id', cert.program_id)
      
      program = programs && programs.length > 0 ? programs[0] : null
    }

    console.log('[v0] Certificate verified successfully:', trimmedCertId, { student: profile?.full_name, program: program?.title })

    return NextResponse.json({
      cert_id: cert.cert_id,
      issued_at: cert.issued_at,
      final_score: cert.final_score,
      revoked: cert.revoked,
      certificate_level: cert.certificate_level,
      profiles: profile,
      programs: program,
    })
  } catch (err) {
    console.error('[v0] Verify certificate error:', err)
    return NextResponse.json({ error: 'Server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
