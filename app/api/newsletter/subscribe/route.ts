import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, preferences } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Check if already subscribed
    const { data: existing } = await adminDb
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 400 })
    }

    // Add subscription
    const { error } = await adminDb.from('newsletter_subscriptions').insert({
      email: email.toLowerCase(),
      preferences,
      subscribed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[v0] Newsletter subscription error:', error)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    // Send welcome email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/email/newsletter-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch (emailErr) {
      console.error('[v0] Failed to send welcome email:', emailErr)
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' })
  } catch (err) {
    console.error('[v0] Newsletter subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
