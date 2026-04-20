import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] DELETE /api/admin/signatures/{id} - ID:', id)

    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('admin_signatures')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting signature:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to delete signature',
        details: error.message
      }, { status: 500 })
    }

    console.log('[v0] Signature deleted:', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Error in DELETE /api/admin/signatures/{id}:', err)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete signature',
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] POST /api/admin/signatures/{id} - ID:', id)

    const adminDb = createAdminClient()

    // Get the action from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    console.log('[v0] Action:', action)

    if (action === 'activate') {
      // Deactivate all other signatures
      const { error: deactivateError } = await adminDb
        .from('admin_signatures')
        .update({ is_primary: false })
        .neq('id', id)

      if (deactivateError) {
        console.warn('[v0] Warning deactivating other signatures:', deactivateError.message)
      }

      // Activate this signature
      const { data: updatedSignature, error } = await adminDb
        .from('admin_signatures')
        .update({ is_primary: true })
        .eq('id', id)
        .select('id, signature_name, is_primary, created_at')
        .single()

      if (error) {
        console.error('[v0] Error activating signature:', error)
        return NextResponse.json({ 
          success: false,
          error: 'Failed to activate signature',
          details: error.message
        }, { status: 500 })
      }

      console.log('[v0] Signature activated:', id)
      return NextResponse.json({ success: true, data: updatedSignature })
    }

    console.warn('[v0] Unknown action:', action)
    return NextResponse.json({ 
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (err) {
    console.error('[v0] Error in POST /api/admin/signatures/{id}:', err)
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
