import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId, email, fullName, amount } = await request.json()

    if (!programId || !email || !fullName || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amountInKES = Math.round(Number(amount))
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Generate unique reference
    const reference = `IICAR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create payment record in database
    const adminDb = createAdminClient()
    const { data: payment, error: paymentError } = await adminDb
      .from('payments')
      .insert({
        student_id: user.id,
        program_id: programId,
        amount_cents: Math.round(amountInKES * 100),
        currency: 'KES',
        status: 'pending',
        paystack_reference: reference,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('[IICAR] Payment record creation error:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reference: reference,
      publicKey: publicKey,
      amount: amountInKES,
      email: email,
      fullName: fullName,
    })
  } catch (error) {
    console.error('[IICAR] Paystack initialization error:', error)
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
