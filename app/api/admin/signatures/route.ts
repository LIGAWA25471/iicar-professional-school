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

    console.log('[v0] Creating signature:', { signature_type, signature_name, has_data: !!signature_data })

    if (!signature_type || !signature_data) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        missing: {
          signature_type: !signature_type,
          signature_data: !signature_data
        }
      }, { status: 400 })
    }

    if (!['upload', 'drawn', 'typed'].includes(signature_type)) {
      return NextResponse.json({ error: 'Invalid signature type' }, { status: 400 })
    }

    if (!signature_name || !signature_name.trim()) {
      return NextResponse.json({ error: 'Signature name is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Set all other signatures to inactive
    const { error: updateError } = await adminDb
      .from('signatures')
      .update({ is_active: false })
      .eq('is_active', true)

    if (updateError) {
      console.error('[v0] Error deactivating other signatures:', updateError)
    }

    // For blob URLs (upload type), signature_data will be a URL
    // For drawn/typed, it will be data (base64 or text)
    // For blob URLs, we store them as-is
    const dataToStore = signature_data

    // Insert new signature
    const { data: newSignature, error } = await adminDb
      .from('signatures')
      .insert({
        user_id: user.id,
        signature_type,
        signature_data: dataToStore,
        signature_name: signature_name.trim(),
        is_active: true,
      })
      .select('id, signature_type, signature_name, is_active, created_at, signature_data')
      .single()

    if (error) {
      console.error('[v0] Error inserting signature:', error)
      throw error
    }

    console.log('[v0] Signature created successfully:', newSignature.id)
    return NextResponse.json(newSignature)
  } catch (err) {
    console.error('[v0] Error creating signature:', err)
    return NextResponse.json({ 
      error: 'Failed to create signature',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
