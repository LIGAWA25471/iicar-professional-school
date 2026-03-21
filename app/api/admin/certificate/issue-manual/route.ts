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
      .single()

    if (certError) {
      console.error('[v0] Certificate creation error:', certError)
      return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 })
    }

    // Get student email
    const { data: student } = await adminDb
      .from('profiles')
      .select('email, full_name')
      .eq('id', studentId)
      .single()

    // Get program title
    const { data: program } = await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single()

    // Send email notification (optional - you can implement later)
    if (student?.email) {
      try {
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

    return NextResponse.json({
      success: true,
      certId: certId,
      message: 'Certificate issued successfully',
    })
  } catch (err) {
    console.error('[v0] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
