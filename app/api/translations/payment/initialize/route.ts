import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { translation_id, amount_cents } = await request.json()

    if (!translation_id || !amount_cents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify translation request belongs to user
    const { data: translation, error: fetchError } = await supabase
      .from('translation_requests')
      .select('id, user_id, document_name')
      .eq('id', translation_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !translation) {
      return NextResponse.json({ error: 'Translation request not found' }, { status: 404 })
    }

    // Generate unique reference
    const reference = `trans_${translation_id.substring(0, 8)}_${Date.now()}`

    console.log('[v0] Translation payment init:', { translationId: translation_id, amountCents: amount_cents, reference })

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount_cents,
        currency: 'KES',
        reference: reference,
        metadata: {
          translation_id,
          document_name: translation.document_name,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('[v0] Paystack init error:', paystackData)
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    // Create payment record
    const adminDb = createAdminClient()
    const { data: payment, error: paymentError } = await adminDb
      .from('translation_payments')
      .insert({
        translation_request_id: translation_id,
        user_id: user.id,
        amount_cents,
        currency: 'KES',
        paystack_reference: reference,
        status: 'pending',
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('[v0] Error creating payment record:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
    }

    // Update translation request status
    await adminDb
      .from('translation_requests')
      .update({ status: 'payment_initiated', paystack_reference: reference })
      .eq('id', translation_id)

    return NextResponse.json({
      status: 'success',
      data: {
        email: user.email,
        amount: amount_cents,
        reference: reference,
        authorization_url: paystackData.data.authorization_url,
      },
    })
  } catch (error) {
    console.error('[v0] Translation payment init error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
