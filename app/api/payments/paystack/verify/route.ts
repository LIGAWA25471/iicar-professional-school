import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
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

    // Update payment record in database
    const adminDb = createAdminClient()
    const { data: payment } = await adminDb
      .from('payments')
      .select('id, student_id, program_id')
      .eq('paystack_reference', reference)
      .single()

    if (!payment) {
      return NextResponse.json(
        { status: 'failed', message: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update payment status to paid
    const { error: updateError } = await adminDb
      .from('payments')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('[IICAR] Payment update error:', updateError)
      return NextResponse.json(
        { status: 'error', message: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    // Create enrollment
    const { error: enrollmentError } = await adminDb
      .from('enrollments')
      .upsert({
        student_id: payment.student_id,
        program_id: payment.program_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'student_id,program_id' })

    if (enrollmentError) {
      console.error('[IICAR] Enrollment creation error:', enrollmentError)
      return NextResponse.json(
        { status: 'warning', message: 'Payment successful but enrollment update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and enrollment completed',
      data: {
        paymentId: payment.id,
        programId: payment.program_id,
        amount: verificationData.data.amount / 100,
        reference: reference,
      },
    })
  } catch (error) {
    console.error('[IICAR] Payment verification error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
