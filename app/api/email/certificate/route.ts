import { NextResponse } from 'next/server'
import { sendCertificateEmail } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { email, studentName, programTitle, certificatePdfUrl } = await request.json()
    
    if (!email || !studentName || !programTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Sending certificate email to:', email)
    const success = await sendCertificateEmail(email, studentName, programTitle, certificatePdfUrl)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Certificate email sent' })
  } catch (err) {
    console.error('[v0] Certificate email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
