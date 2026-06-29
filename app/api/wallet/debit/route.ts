import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { studentId, amountCents, description, referenceId, referenceType } = await request.json()

    if (!studentId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    const adminDb = createAdminClient()

    // Get current wallet balance
    const { data: wallet, error: walletError } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Check sufficient balance
    if (wallet.balance_cents < amountCents) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const newBalance = wallet.balance_cents - amountCents

    // Update wallet balance
    const { error: updateError } = await adminDb
      .from('student_wallets')
      .update({
        balance_cents: newBalance,
        total_spent_cents: wallet.total_spent_cents + amountCents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('[v0] Error updating wallet:', updateError)
      return NextResponse.json(
        { error: 'Failed to process wallet debit' },
        { status: 500 }
      )
    }

    // Record transaction
    const { error: transError } = await adminDb
      .from('wallet_transactions')
      .insert({
        student_id: studentId,
        wallet_id: wallet.id,
        type: 'debit',
        amount_cents: amountCents,
        description,
        reference_id: referenceId,
        reference_type: referenceType,
        balance_after_cents: newBalance,
      })

    if (transError) {
      console.error('[v0] Error recording transaction:', transError)
    }

    return NextResponse.json({
      success: true,
      newBalance,
      balanceUSD: Math.round(newBalance / 13400),
      balanceKES: Math.round(newBalance / 100),
    })
  } catch (error) {
    console.error('[v0] Wallet debit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
