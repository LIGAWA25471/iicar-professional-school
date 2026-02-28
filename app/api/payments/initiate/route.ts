import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { initiateSTKPush } from '@/lib/kopokopo'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId, phoneNumber, amount } = await request.json()

    if (!programId || !phoneNumber || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalise phone to E.164 (+254...)
    const digits = String(phoneNumber).replace(/\D/g, '')
    let e164: string | null = null
    if (digits.startsWith('254') && digits.length === 12) {
      e164 = `+${digits}`
    } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
      e164 = `+254${digits}`
    } else if (digits.startsWith('07') || digits.startsWith('01')) {
      e164 = `+254${digits.slice(1)}`
    }

    if (!e164) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format 0712345678 or 254712345678.' },
        { status: 400 }
      )
    }

    // Fetch student profile for name
    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    const nameParts = (profile?.full_name ?? 'Student').trim().split(' ')
    const firstName = nameParts[0] ?? 'Student'
    const lastName  = nameParts.slice(1).join(' ') || 'User'

    // Create pending payment record (use service role to avoid RLS issues on insert)
    const { data: payment, error: paymentError } = await adminDb
      .from('payments')
      .insert({
        student_id:   user.id,
        program_id:   programId,
        amount_cents: Math.round(Number(amount) * 100),
        currency:     'KES',
        status:       'pending',
        phone_number: e164,
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('[IICAR] Payment record error:', paymentError.message)
      // Column missing — guide admin to run the migration
      if (paymentError.message.includes('column') || paymentError.code === '42703') {
        return NextResponse.json({
          error: 'Database migration required. Please run the following SQL in your Supabase SQL Editor:\n\nALTER TABLE public.payments ADD COLUMN IF NOT EXISTS phone_number TEXT;\nALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_location TEXT;\nALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_reference TEXT;'
        }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to create payment record: ' + paymentError.message }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
    const callbackUrl = `${appUrl}/api/payments/callback`

    // Initiate STK push
    const result = await initiateSTKPush({
      firstName,
      lastName,
      phoneNumber: e164,
      amount:      Math.round(Number(amount)),
      callbackUrl,
      metadata: {
        payment_id: payment.id,
        program_id: programId,
        student_id: user.id,
      },
    })

    // Store the KopoKopo location URL so we can poll/match callbacks
    await adminDb
      .from('payments')
      .update({ kopokopo_location: result.location })
      .eq('id', payment.id)

    return NextResponse.json({
      success:   true,
      paymentId: payment.id,
      location:  result.location,
      message:   'M-Pesa prompt sent. Enter your PIN to complete payment.',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[IICAR] Payment initiation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
