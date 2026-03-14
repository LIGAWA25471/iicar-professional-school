import { NextResponse } from 'next/server'
import { Resend } from 'resend'

async function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[v0] RESEND_API_KEY not configured')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const resend = await getResendClient()
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    await resend.emails.send({
      from: 'noreply@iicar.org',
      to: email,
      subject: 'Welcome to IICAR Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 30px; text-align: center; border-radius: 8px; color: white;">
            <h2 style="margin: 0; font-size: 28px;">Welcome to IICAR!</h2>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="color: #333; font-size: 16px;">Hello,</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Thank you for subscribing to IICAR's newsletter! You'll now receive updates about:
            </p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>🎓 New programs and professional certifications</li>
              <li>🎉 Special promotions and exclusive offers</li>
              <li>💡 Marketing tips and professional development content</li>
            </ul>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Stay tuned for amazing opportunities to advance your career with IICAR's globally recognized certifications.
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="https://iicar.org/dashboard/programs" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Explore Programs
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
              You can manage your subscription preferences anytime by visiting our website.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Newsletter welcome email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
