import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Verify user is admin
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, programId, finalScore, certificateLevel } = body

    if (!studentId || !programId || finalScore === undefined || !certificateLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate certificate ID
    const certId = `IICAR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    console.log('[v0] Creating certificate:', { certId, studentId, programId, finalScore, certificateLevel })

    // Create certificate with all fields
    const { data: cert, error: certError } = await adminDb
      .from('certificates')
      .insert({
        student_id: studentId,
        program_id: programId,
        cert_id: certId,
        final_score: parseInt(finalScore),
        certificate_level: certificateLevel,
        issued_at: new Date().toISOString(),
        revoked: false,
      })
      .select()

    if (certError) {
      console.error('[v0] Certificate creation error:', certError)
      return NextResponse.json({ error: `Failed to create certificate: ${certError.message}` }, { status: 500 })
    }

    if (!cert || cert.length === 0) {
      console.error('[v0] Certificate not returned from insert')
      return NextResponse.json({ error: 'Certificate created but could not retrieve it' }, { status: 500 })
    }

    console.log('[v0] Certificate created successfully:', certId)

    // Get student name
    const { data: students } = await adminDb
      .from('profiles')
      .select('email, full_name')
      .eq('id', studentId)

    const student = students && students.length > 0 ? students[0] : null

    // Get program title
    const { data: programs } = await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)

    const program = programs && programs.length > 0 ? programs[0] : null

    // Send email notification (optional - you can implement later)
    if (student?.email) {
      try {
        console.log('[v0] Sending email notification to:', student.email)
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/certificate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: student.email,
            studentName: student.full_name,
            programTitle: program?.title,
            certId: certId,
            certificateLevel,
          }),
        })
      } catch (emailErr) {
        console.error('[v0] Email notification error:', emailErr)
        // Continue even if email fails
      }
    }

    console.log('[v0] Certificate issuance complete:', { certId, student: student?.full_name })

    return NextResponse.json({
      success: true,
      certId: certId,
      message: 'Certificate issued successfully',
    })
  } catch (err) {
    console.error('[v0] Certificate issuance error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: `Certificate issuance failed: ${errorMessage}` }, { status: 500 })
  }
}
