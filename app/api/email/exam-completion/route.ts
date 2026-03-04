import { NextResponse } from 'next/server'
import { sendExamCompletionEmail } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { email, studentName, programTitle, score } = await request.json()
    
    if (!email || !studentName || !programTitle || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Sending exam completion email to:', email, 'Score:', score)
    const success = await sendExamCompletionEmail(email, studentName, programTitle, score)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Exam completion email sent' })
  } catch (err) {
    console.error('[v0] Exam completion email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
