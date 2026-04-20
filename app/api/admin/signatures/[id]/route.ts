import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('signatures')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Error deleting signature:', err)
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    // Get the action from the URL path
    const url = new URL(request.url)
    const action = url.pathname.split('/').pop()

    if (action === 'activate') {
      // Set all signatures to inactive
      await adminDb
        .from('signatures')
        .update({ is_active: false })
        .eq('is_active', true)

      // Set this one as active
      const { error } = await adminDb
        .from('signatures')
        .update({ is_active: true })
        .eq('id', id)

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[v0] Error updating signature:', err)
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
  }
}
