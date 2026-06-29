import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Get or create student wallet
    let { data: wallet, error: walletError } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', user.id)
      .single()

    if (walletError && walletError.code === 'PGRST116') {
      // Wallet doesn't exist, create one
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

    // Get recent transactions
    const { data: transactions } = await adminDb
      .from('wallet_transactions')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      wallet,
      transactions: transactions || [],
      balanceUSD: Math.round((wallet.balance_cents || 0) / 13400),
      balanceKES: Math.round((wallet.balance_cents || 0) / 100),
    })
  } catch (error) {
    console.error('[v0] Wallet balance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
