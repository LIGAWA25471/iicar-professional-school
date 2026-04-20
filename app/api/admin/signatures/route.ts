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

    if (!signature_type || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Set all other signatures to inactive if this one is being set as active
    await adminDb
      .from('signatures')
      .update({ is_active: false })
      .eq('is_active', true)

    // Insert new signature
    const { data: newSignature, error } = await adminDb
      .from('signatures')
      .insert({
        user_id: user.id,
        signature_type,
        signature_data,
        signature_name: signature_name || `${signature_type} Signature`,
        is_active: true,
      })
      .select('id, signature_type, signature_name, is_active, created_at')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newSignature)
  } catch (err) {
    console.error('[v0] Error creating signature:', err)
    return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 })
  }
}
