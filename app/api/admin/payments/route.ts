import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify admin user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile || profile.is_admin !== true) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all payments with related program and student info
    const { data: payments, error } = await adminDb
      .from('payments')
      .select(`
        id,
        student_id,
        program_id,
        amount_cents,
        currency,
        status,
        created_at,
        paid_at,
        phone_number,
        kopokopo_reference,
        paystack_reference,
        programs(title),
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ 
      payments: payments || [],
      count: payments?.length || 0
    })
  } catch (error) {
    console.error('[v0] Payments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
