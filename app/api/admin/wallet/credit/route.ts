import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role (you can add role-based access control here)
    const body = await request.json()
    const student_id = body.student_id || body.studentId
    const amount_cents = body.amount_cents || body.amountCents
    const description = body.reason || body.description
    const transaction_type = body.transaction_type || body.transactionType

    if (!student_id || !amount_cents || amount_cents <= 0) {
      console.error('[v0] Credit API - Invalid params:', { student_id, amount_cents })
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    const adminDb = createAdminClient()

    // Get student wallet
    let { data: wallet, error: walletError } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await adminDb
        .from('student_wallets')
        .insert({
          student_id: student_id,
          balance_cents: amount_cents,
          total_credited_cents: amount_cents,
          total_spent_cents: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error('[v0] Error creating wallet:', createError)
        return NextResponse.json(
          { error: 'Failed to create wallet' },
          { status: 500 }
        )
      }

      wallet = newWallet
    } else if (walletError) {
      console.error('[v0] Error fetching wallet:', walletError)
      return NextResponse.json(
        { error: 'Failed to fetch wallet' },
        { status: 500 }
      )
    }

    const newBalance = wallet.balance_cents + amount_cents

    // Update wallet balance
    const { error: updateError } = await adminDb
      .from('student_wallets')
      .update({
        balance_cents: newBalance,
        total_credited_cents: wallet.total_credited_cents + amount_cents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('[v0] Error updating wallet:', updateError)
      return NextResponse.json(
        { error: 'Failed to credit wallet' },
        { status: 500 }
      )
    }

    // Record transaction
    const { error: transError } = await adminDb
      .from('wallet_transactions')
      .insert({
        student_id: student_id,
        transaction_type: transaction_type,
        amount_cents: amount_cents,
        description: description,
        reference_id: wallet.id,
        created_at: new Date().toISOString(),
      })

    if (transError) {
      console.error('[v0] Error recording transaction:', transError)
    }

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance_cents: newBalance,
        balanceUSD: Math.round(newBalance / 13400),
        balanceKES: Math.round(newBalance / 100),
      },
    })
  } catch (error) {
    console.error('[v0] Admin wallet credit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
