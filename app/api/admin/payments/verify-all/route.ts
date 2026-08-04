import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify admin status
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const adminDb = createAdminClient()

    // Get current user
    const { data: { user }, error: userError } = await adminDb.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    // Get all pending payments
    const { data: pendingPayments, error: fetchError } = await adminDb
      .from('payments')
      .select('id, student_id, program_id, paystack_reference, created_at')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('[v0] Error fetching pending payments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch payments', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({
        message: 'No pending payments to verify',
        verified: 0,
        updated: 0,
      })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Paystack not configured' },
        { status: 500 }
      )
    }

    let verified = 0
    let updated = 0
    const results = []

    // Verify each payment with Paystack
    for (const payment of pendingPayments) {
      try {
        // Skip if no paystack reference
        if (!payment.paystack_reference) {
          results.push({
            paymentId: payment.id,
            status: 'skipped',
            reason: 'No paystack reference',
          })
          continue
        }

        // Verify with Paystack
        const verifyResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${payment.paystack_reference}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
          }
        )

        if (!verifyResponse.ok) {
          console.error(
            `[v0] Paystack verification failed for ${payment.paystack_reference}:`,
            verifyResponse.status
          )
          results.push({
            paymentId: payment.id,
            status: 'failed',
            reason: 'Paystack API error',
          })
          continue
        }

        const verificationData = await verifyResponse.json()
        verified++

        // Check payment status from Paystack
        const paymentStatus = verificationData.data?.status

        if (paymentStatus === 'success') {
          // Update to paid
          const { error: updateError } = await adminDb
            .from('payments')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

          if (!updateError) {
            // Create enrollment if payment is now paid
            await adminDb.from('enrollments').upsert(
              {
                student_id: payment.student_id,
                program_id: payment.program_id,
                status: 'active',
                enrolled_at: new Date().toISOString(),
              },
              { onConflict: 'student_id,program_id' }
            )

            updated++
            results.push({
              paymentId: payment.id,
              status: 'updated_to_paid',
              paystackStatus: paymentStatus,
            })
          } else {
            results.push({
              paymentId: payment.id,
              status: 'error',
              reason: 'Database update failed',
            })
          }
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          // Update to failed
          const { error: updateError } = await adminDb
            .from('payments')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

          if (!updateError) {
            updated++
            results.push({
              paymentId: payment.id,
              status: 'updated_to_failed',
              paystackStatus: paymentStatus,
            })
          }
        } else {
          results.push({
            paymentId: payment.id,
            status: 'still_pending',
            paystackStatus: paymentStatus,
          })
        }
      } catch (err) {
        console.error(
          `[v0] Error verifying payment ${payment.id}:`,
          err
        )
        results.push({
          paymentId: payment.id,
          status: 'error',
          reason: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: 'Batch verification completed',
      totalPending: pendingPayments.length,
      verified,
      updated,
      results,
    })
  } catch (error) {
    console.error('[v0] Batch verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
