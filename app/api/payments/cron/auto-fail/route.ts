import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { subMinutes } from 'date-fns'

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('[v0] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Get all pending payments older than 5 minutes
    const fiveMinutesAgo = subMinutes(new Date(), 5)

    const { data: oldPendingPayments, error: fetchError } = await adminDb
      .from('payments')
      .select('id, created_at')
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo.toISOString())

    if (fetchError) {
      console.error('[v0] Error fetching old pending payments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    if (!oldPendingPayments || oldPendingPayments.length === 0) {
      console.log('[v0] No pending payments to auto-fail')
      return NextResponse.json({
        status: 'success',
        message: 'No payments to auto-fail',
        updated: 0,
      })
    }

    // Auto-fail these payments
    const paymentIds = oldPendingPayments.map(p => p.id)

    const { error: updateError } = await adminDb
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .in('id', paymentIds)

    if (updateError) {
      console.error('[v0] Error auto-failing payments:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payments' },
        { status: 500 }
      )
    }

    console.log(`[v0] Auto-failed ${paymentIds.length} pending payments older than 5 minutes`)

    return NextResponse.json({
      status: 'success',
      message: `Auto-failed ${paymentIds.length} pending payments`,
      updated: paymentIds.length,
    })
  } catch (error) {
    console.error('[v0] Cron auto-fail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
