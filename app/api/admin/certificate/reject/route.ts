import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { certificateId, reason } = await request.json()

  if (!certificateId) {
    return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
  }

  // Update certificate to rejected status
  const { error: updateError } = await adminDb
    .from('certificates')
    .update({
      approval_status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', certificateId)

  if (updateError) {
    console.error('[v0] Error rejecting certificate:', updateError)
    return NextResponse.json({ error: 'Failed to reject certificate' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Certificate rejected' })
}
