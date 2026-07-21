import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { program_id, amount_cents } = await request.json()

    if (!program_id || !amount_cents) {
      return NextResponse.json({ error: 'Missing program_id or amount_cents' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Get student wallet
    const { data: wallet, error: walletError } = await adminDb
      .from('student_wallets')
      .select('*')
      .eq('student_id', user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Check balance
    if (wallet.balance_cents < amount_cents) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await adminDb
      .from('enrollments')
      .insert({
        student_id: user.id,
        program_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('[v0] Enrollment error:', enrollmentError)
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
    }

    // Debit wallet
    const newBalance = wallet.balance_cents - amount_cents
    const { error: updateError } = await adminDb
      .from('student_wallets')
      .update({
        balance_cents: newBalance,
        total_spent_cents: (wallet.total_spent_cents || 0) + amount_cents,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', user.id)

    if (updateError) {
      console.error('[v0] Wallet update error:', updateError)
      // Rollback enrollment
      await adminDb.from('enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
    }

    // Create transaction record
    await adminDb.from('wallet_transactions').insert({
      student_id: user.id,
      transaction_type: 'enrollment_debit',
      amount_cents,
      description: `Enrollment in course: ${program_id}`,
      reference_id: enrollment.id,
    })

    console.log('[v0] Wallet enrollment successful:', { user_id: user.id, program_id, amount_cents })

    return NextResponse.json({
      success: true,
      enrollment,
      new_balance: newBalance,
    })
  } catch (error) {
    console.error('[v0] Wallet enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
