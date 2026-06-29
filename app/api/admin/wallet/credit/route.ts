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
    const { studentId, amountCents, description, transactionType } = await request.json()

    if (!studentId || !amountCents || amountCents <= 0) {
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
      .eq('student_id', studentId)
      .single()

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await adminDb
        .from('student_wallets')
        .insert({
          student_id: studentId,
          balance_cents: amountCents,
          total_credited_cents: amountCents,
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

    const newBalance = wallet.balance_cents + amountCents

    // Update wallet balance
    const { error: updateError } = await adminDb
      .from('student_wallets')
      .update({
        balance_cents: newBalance,
        total_credited_cents: wallet.total_credited_cents + amountCents,
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
        student_id: studentId,
        wallet_id: wallet.id,
        type: 'credit',
        amount_cents: amountCents,
        description,
        reference_type: transactionType,
        balance_after_cents: newBalance,
        created_by: admin.id,
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
