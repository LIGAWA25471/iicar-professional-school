import { NextResponse, NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/payments/status?paymentId=xxx
// Used by the enrollment payment component to poll payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()
    const { data: payment, error } = await adminDb
      .from('payments')
      .select('id, status, paid_at, kopokopo_reference, program_id')
      .eq('id', paymentId)
      .eq('student_id', user.id)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'paid') {
      const { error: enrollmentError } = await adminDb
        .from('enrollments')
        .upsert({
          student_id: user.id,
          program_id: payment.program_id,
          status: 'active',
          enrolled_at: payment.paid_at ?? new Date().toISOString(),
        }, { onConflict: 'student_id,program_id' })
      if (enrollmentError) console.error('[IICAR] Enrollment recovery error:', enrollmentError.message)
    }

    return NextResponse.json({
      status:    payment.status,
      paid_at:   payment.paid_at,
      reference: payment.kopokopo_reference,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
