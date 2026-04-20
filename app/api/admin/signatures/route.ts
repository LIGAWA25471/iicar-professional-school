import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { data: signatures, error } = await adminDb
      .from('signatures')
      .select('id, signature_type, signature_name, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(signatures)
  } catch (err) {
    console.error('[v0] Error fetching signatures:', err)
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { signature_type, signature_data, signature_name } = body

    console.log('[v0] Creating signature:', { signature_type, signature_name, data_length: signature_data?.length })

    // Validation
    if (!signature_type) {
      return NextResponse.json({ error: 'signature_type is required' }, { status: 400 })
    }
    if (!signature_data) {
      return NextResponse.json({ error: 'signature_data is required' }, { status: 400 })
    }
    if (!signature_name?.trim()) {
      return NextResponse.json({ error: 'signature_name is required and must not be empty' }, { status: 400 })
    }

    if (!['upload', 'drawn', 'typed'].includes(signature_type)) {
      return NextResponse.json({ error: `Invalid signature_type. Must be 'upload', 'drawn', or 'typed'` }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Deactivate other signatures
    try {
      await adminDb
        .from('signatures')
        .update({ is_active: false })
        .eq('is_active', true)
    } catch (deactivateErr) {
      console.log('[v0] Note: Could not deactivate other signatures (may not exist yet):', deactivateErr)
    }

    // Insert new signature
    const { data: newSignature, error } = await adminDb
      .from('signatures')
      .insert({
        user_id: user.id,
        signature_type,
        signature_data: String(signature_data),
        signature_name: signature_name.trim(),
        is_active: true,
      })
      .select('id, signature_type, signature_name, is_active, created_at, signature_data')
      .single()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json({ 
        error: 'Failed to save signature to database',
        details: error.message || String(error)
      }, { status: 500 })
    }

    console.log('[v0] Signature created successfully:', newSignature.id)
    return NextResponse.json(newSignature)
  } catch (err) {
    console.error('[v0] Error in POST /api/admin/signatures:', err)
    return NextResponse.json({ 
      error: 'Failed to create signature',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
