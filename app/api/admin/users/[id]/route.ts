import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()
    const { data: adminProfile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!adminProfile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    if (id === user.id) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })

    const { data: target } = await adminDb.from('profiles').select('id, is_admin').eq('id', id).single()
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.is_admin) return NextResponse.json({ error: 'Admin accounts cannot be deleted here' }, { status: 403 })

    const { error } = await adminDb.auth.admin.deleteUser(id)
    if (error) {
      console.error('[v0] Admin delete user error:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
