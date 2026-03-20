import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const { data: signatures, error } = await adminDb
    .from('admin_signatures')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
  }

  return NextResponse.json(signatures)
}

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

  const { signatureData, name, title } = await request.json()

  if (!signatureData || !name) {
    return NextResponse.json({ error: 'Signature data and name required' }, { status: 400 })
  }

  // Check if this is the first signature (make it primary)
  const { data: existing } = await adminDb
    .from('admin_signatures')
    .select('id')
    .limit(1)

  const isPrimary = !existing || existing.length === 0

  const { data: newSig, error } = await adminDb
    .from('admin_signatures')
    .insert({
      admin_id: user.id,
      signature_name: name,
      signature_title: title || 'Administrator',
      signature_data: signatureData,
      is_primary: isPrimary,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error saving signature:', error)
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
  }

  return NextResponse.json(newSig)
}

export async function DELETE(request: Request) {
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

  const { signatureId } = await request.json()

  if (!signatureId) {
    return NextResponse.json({ error: 'Signature ID required' }, { status: 400 })
  }

  const { error } = await adminDb
    .from('admin_signatures')
    .delete()
    .eq('id', signatureId)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
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

  const { signatureId } = await request.json()

  if (!signatureId) {
    return NextResponse.json({ error: 'Signature ID required' }, { status: 400 })
  }

  // Set all signatures to non-primary
  await adminDb
    .from('admin_signatures')
    .update({ is_primary: false })
    .neq('id', signatureId)

  // Set this one as primary
  const { error } = await adminDb
    .from('admin_signatures')
    .update({ is_primary: true })
    .eq('id', signatureId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
