import { NextResponse } from 'next/server'
import { sendEnrollmentEmail } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { email, studentName, programTitle } = await request.json()
    
    if (!email || !studentName || !programTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Sending enrollment email to:', email)
    const success = await sendEnrollmentEmail(email, studentName, programTitle)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Enrollment email sent' })
  } catch (err) {
    console.error('[v0] Enrollment email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
