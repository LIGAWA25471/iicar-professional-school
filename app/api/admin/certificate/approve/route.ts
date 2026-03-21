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

  // Get the certificate
  const { data: cert, error: certError } = await adminDb
    .from('certificates')
    .select('id, cert_id, student_id, program_id, approval_status, profiles(full_name, id), programs(title)')
    .eq('id', certificateId)
    .single()

  if (certError || !cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  if (cert.approval_status === 'approved') {
    return NextResponse.json({ error: 'Certificate already approved' }, { status: 400 })
  }

  // Update certificate to approved status
  const { error: updateError } = await adminDb
    .from('certificates')
    .update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      issued_at: new Date().toISOString(),
      primary_signature_id: primarySignatureId || null,
      secondary_signature_id: secondarySignatureId || null,
    })
    .eq('id', certificateId)

  if (updateError) {
    console.error('[v0] Error approving certificate:', updateError)
    return NextResponse.json({ error: 'Failed to approve certificate' }, { status: 500 })
  }

  // Get student email for notification
  const { data: studentAuth } = await adminDb.auth.admin.getUserById(cert.student_id)
  
  if (studentAuth?.user?.email) {
    const profile = cert.profiles as { full_name: string } | null
    const program = cert.programs as { title: string } | null
    
    const certificatePdfUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/certificate/download/${cert.cert_id}`
    
    await sendCertificateNotification(
      studentAuth.user.email,
      profile?.full_name || 'Student',
      program?.title || 'Program',
      certificatePdfUrl
    )
  }

  return NextResponse.json({ success: true, message: 'Certificate approved successfully' })
}
