import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_API_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount_cents, user_id } = await request.json()

    if (!amount_cents || amount_cents < 10000) {
      return NextResponse.json({ error: 'Minimum amount is KES 100' }, { status: 400 })
    }

    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Get or create wallet
    let { data: wallet } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', user.id)
      .single()

    if (!wallet) {
      const { data: newWallet } = await adminDb
        .from('student_wallets')
        .insert({
          student_id: user.id,
          balance_cents: 0,
          total_credited_cents: 0,
          total_spent_cents: 0,
        })
        .select()
        .single()
      wallet = newWallet
    }

    // Get user email
    const { data: profile } = await adminDb
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Generate unique reference
    const reference = `wallet_topup_${user.id.substring(0, 8)}_${crypto.randomUUID().substring(0, 8)}`

    // Initialize Paystack transaction
    // Send amount in KES to Paystack (convert from cents)
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email,
        amount: amount_cents, // Amount in cents (Paystack expects kobo for NGN, cents for others)
        currency: 'KES',
        reference: reference,
        metadata: {
          wallet_topup: true,
          student_id: user.id,
          amount_cents: amount_cents,
        },
      }),
    })

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.text()
      console.error('[v0] Paystack error:', errorData)
      return NextResponse.json(
        { error: 'Failed to initialize payment with Paystack' },
        { status: 500 }
      )
    }

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    // Store pending transaction
    await adminDb
      .from('wallet_transactions')
      .insert({
        student_id: user.id,
        transaction_type: 'topup_pending',
        amount_cents: amount_cents,
        description: 'Wallet top-up via Paystack',
        reference_id: paystackData.data.reference,
      })

    return NextResponse.json({
      status: true,
      message: 'Payment initialized',
      data: {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
        email: profile.email,
        amount: amount_cents,
        currency: 'KES',
      },
    })
  } catch (error) {
    console.error('[v0] Wallet topup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
