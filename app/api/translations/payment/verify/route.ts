import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference, translation_id } = await request.json()

    if (!reference || !translation_id) {
      return NextResponse.json({ error: 'Missing reference or translation_id' }, { status: 400 })
    }

    console.log('[v0] Verifying translation payment:', { reference, translationId: translation_id })

    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('[v0] Paystack verify error:', paystackData)
      return NextResponse.json({ status: 'failed', message: 'Payment verification failed' }, { status: 400 })
    }

    const transaction = paystackData.data
    console.log('[v0] Paystack verification status:', transaction.status)

    const adminDb = createAdminClient()

    if (transaction.status === 'success') {
      // Update payment record
      await adminDb
        .from('translation_payments')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      // Update translation request
      const { data: updatedTranslation, error: updateError } = await adminDb
        .from('translation_requests')
        .update({
          status: 'paid',
          payment_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', translation_id)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Error updating translation request:', updateError)
        throw updateError
      }

      console.log('[v0] Payment verified successfully for translation:', translation_id)

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          translation_id,
          paystack_reference: reference,
        },
      })
    } else {
      // Payment failed
      await adminDb
        .from('translation_payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      return NextResponse.json({
        status: 'failed',
        message: `Payment ${transaction.status}`,
      }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Translation payment verification error:', error)
    return NextResponse.json(
      { status: 'failed', message: error instanceof Error ? error.message : 'Verification error' },
      { status: 500 }
    )
  }
}
