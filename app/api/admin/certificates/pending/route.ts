import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const adminDb = createAdminClient()

    // Fetch all pending certificates with student and program details
    const { data: pendingCerts, error } = await adminDb
      .from('certificates')
      .select('id, cert_id, final_score, student_id, program_id, approval_status, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching pending certificates:', error)
      return NextResponse.json({ error: 'Failed to fetch pending certificates' }, { status: 500 })
    }

    // Fetch student and program details for each certificate
    const certsWithDetails = await Promise.all(
      (pendingCerts || []).map(async (cert) => {
        const [profileRes, programRes] = await Promise.all([
          adminDb.from('profiles').select('full_name, email').eq('id', cert.student_id).single(),
          adminDb.from('programs').select('title').eq('id', cert.program_id).single(),
        ])
        return {
          ...cert,
          student: profileRes.data,
          program: programRes.data,
        }
      })
    )

    return NextResponse.json({ 
      count: certsWithDetails.length,
      certificates: certsWithDetails 
    })
  } catch (err) {
    console.error('[v0] Pending certificates fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
