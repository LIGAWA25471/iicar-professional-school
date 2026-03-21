import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { enrollmentId, finalScore, certificateLevel } = await request.json()
    
    if (!enrollmentId || finalScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Get enrollment details
    const { data: enrollment, error: enrollError } = await adminDb
      .from('enrollments')
      .select('id, student_id, program_id, status')
      .eq('id', enrollmentId)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Update enrollment status to completed
    const { error: updateError } = await adminDb
      .from('enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('[v0] Update enrollment error:', updateError)
      return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 })
    }

    // Generate certificate ID
    const certId = `IICAR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Create certificate
    const { data: cert, error: certError } = await adminDb
      .from('certificates')
      .insert({
        student_id: enrollment.student_id,
        program_id: enrollment.program_id,
        cert_id: certId,
        final_score: parseInt(finalScore),
        certificate_level: certificateLevel || 1,
        issued_at: new Date().toISOString(),
        revoked: false,
      })
      .select()
      .single()

    if (certError) {
      console.error('[v0] Certificate creation error:', certError)
      return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      certificate: cert,
      message: 'Enrollment completed and certificate issued'
    })
  } catch (err) {
    console.error('[v0] Complete enrollment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
