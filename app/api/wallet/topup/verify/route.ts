import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    )

    if (!verifyResponse.ok) {
      console.error('[IICAR] Paystack verification failed:', verifyResponse.status)
      return NextResponse.json(
        { status: 'failed', message: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const verificationData = await verifyResponse.json()

    if (!verificationData.status || verificationData.data.status !== 'success') {
      return NextResponse.json({
        status: 'failed',
        message: 'Payment was not successful',
      })
    }

    const adminDb = createAdminClient()

    // Get or create wallet for user
    let { data: wallet, error: walletError } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', user.id)
      .single()

    if (walletError || !wallet) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await adminDb
        .from('student_wallets')
        .insert({
          student_id: user.id,
          balance_cents: 0,
          total_credited_cents: 0,
          total_spent_cents: 0,
        })
        .select()
        .single()

      if (createError || !newWallet) {
        console.error('[IICAR] Wallet creation error:', createError)
        return NextResponse.json(
          { status: 'error', message: 'Failed to create wallet' },
          { status: 500 }
        )
      }
      wallet = newWallet
    }

    const amountCents = verificationData.data.amount

    // Update wallet balance
    const newBalance = wallet.balance_cents + amountCents
    const newTotalCredited = wallet.total_credited_cents + amountCents

    const { error: updateError } = await adminDb
      .from('student_wallets')
      .update({
        balance_cents: newBalance,
        total_credited_cents: newTotalCredited,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', user.id)

    if (updateError) {
      console.error('[IICAR] Wallet update error:', updateError)
      return NextResponse.json(
        { status: 'error', message: 'Failed to update wallet balance' },
        { status: 500 }
      )
    }

    // Create transaction record
    const { error: transactionError } = await adminDb
      .from('wallet_transactions')
      .update({
        transaction_type: 'topup_completed',
        description: `Wallet top-up via Paystack (Ref: ${reference})`,
      })
      .eq('student_id', user.id)
      .eq('reference_id', reference)

    if (transactionError) {
      console.warn('[IICAR] Transaction record update warning:', transactionError)
      // Don't fail the entire response if transaction record fails
    }

    return NextResponse.json({
      status: 'success',
      message: 'Wallet top-up verified and credited',
      data: {
        walletId: wallet.id,
        newBalance: newBalance,
        amountAdded: amountCents,
        reference: reference,
      },
    })
  } catch (error) {
    console.error('[IICAR] Wallet topup verification error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
