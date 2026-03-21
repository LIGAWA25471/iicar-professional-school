import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function sendCertificateNotification(email: string, studentName: string, programTitle: string, certificatePdfUrl: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/email/certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, studentName, programTitle, certificatePdfUrl }),
    })
    return res.ok
  } catch (err) {
    console.error('[v0] Failed to send certificate notification:', err)
    return false
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { certificateId, primarySignatureId, secondarySignatureId } = await request.json()

  if (!certificateId) {
    return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
  }

  // Get the certificate - only query columns that exist
  const { data: cert, error: certError } = await adminDb
    .from('certificates')
    .select('id, cert_id, student_id, program_id, issued_at')
    .eq('id', certificateId)
    .single()

  if (certError || !cert) {
    console.error('[v0] Certificate fetch error:', certError)
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  // Check if already issued
  if (cert.issued_at !== null) {
    return NextResponse.json({ error: 'Certificate already issued' }, { status: 400 })
  }

  // Get student and program details separately
  const [{ data: studentProfile }, { data: program }] = await Promise.all([
    adminDb.from('profiles').select('full_name, email').eq('id', cert.student_id).single(),
    adminDb.from('programs').select('title').eq('id', cert.program_id).single(),
  ])

  // Update certificate to issued status
  const { error: updateError } = await adminDb
    .from('certificates')
    .update({
      issued_at: new Date().toISOString(),
    })
    .eq('id', certificateId)

  if (updateError) {
    console.error('[v0] Error approving certificate:', updateError)
    return NextResponse.json({ error: 'Failed to approve certificate' }, { status: 500 })
  }

  console.log('[v0] Certificate approved:', cert.cert_id)

  // Send notification to student
  if (studentProfile?.email) {
    const certificatePdfUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/certificate/download/${cert.cert_id}`
    await sendCertificateNotification(
      studentProfile.email,
      studentProfile.full_name || 'Student',
      program?.title || 'Program',
      certificatePdfUrl
    )
  }

  return NextResponse.json({ success: true, cert_id: cert.cert_id })
}
