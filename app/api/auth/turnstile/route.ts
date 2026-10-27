import { NextResponse } from 'next/server'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Captcha verification is required.' }, { status: 400 })
    }

    const formData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY ?? '')
    formData.append('response', token)

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Turnstile verification error:', error)
    return NextResponse.json({ error: 'Captcha verification is temporarily unavailable.' }, { status: 503 })
  }
}
