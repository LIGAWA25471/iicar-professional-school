import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { data: signatures, error } = await adminDb
      .from('admin_signatures')
      .select('id, signature_name, is_primary, created_at')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Supabase GET error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch signatures',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: signatures })
  } catch (err) {
    console.error('[v0] Error in GET /api/admin/signatures:', err)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch signatures',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Step 1: Parse and log request
    console.log('[v0] POST /api/admin/signatures - Starting')
    const body = await request.json()
    console.log('[v0] REQUEST BODY:', body)

    // Step 2: Validate request fields exist
    console.log('[v0] Validating required fields...')
    if (!body.signature_data) {
      console.warn('[v0] Validation failed: missing signature_data')
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed',
        field: 'signature_data',
        message: 'signature_data is required'
      }, { status: 400 })
    }
    if (!body.signature_name?.trim()) {
      console.warn('[v0] Validation failed: missing signature_name')
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed',
        field: 'signature_name',
        message: 'signature_name is required and must not be empty'
      }, { status: 400 })
    }

    // Step 3: Authenticate user
    console.log('[v0] Authenticating user...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('[v0] Auth error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    if (!user) {
      console.warn('[v0] No user found in session')
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    console.log('[v0] User authenticated:', user.id)

    // Step 4: Get user profile to get admin_id
    console.log('[v0] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[v0] Could not find profile:', profileError)
      return NextResponse.json({ 
        success: false,
        error: 'User profile not found'
      }, { status: 401 })
    }

    // Step 5: Initialize admin client
    console.log('[v0] Initializing admin client...')
    const adminDb = createAdminClient()

    // Step 6: Deactivate other signatures if this one is primary
    console.log('[v0] Deactivating other primary signatures...')
    const { error: deactivateError } = await adminDb
      .from('admin_signatures')
      .update({ is_primary: false })
      .eq('is_primary', true)
    
    if (deactivateError) {
      console.warn('[v0] Warning - Could not deactivate other signatures:', deactivateError.message)
    }

    // Step 7: Prepare data for insert - MATCH EXACT admin_signatures SCHEMA
    console.log('[v0] Preparing data for insert...')
    const insertPayload = {
      admin_id: profile.id,
      signature_name: body.signature_name.trim(),
      signature_title: body.signature_title || 'Administrator',
      signature_data: String(body.signature_data),
      is_primary: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    console.log('[v0] INSERT PAYLOAD:', { ...insertPayload, signature_data: 'DATA_TRUNCATED' })

    // Step 8: Insert new signature into admin_signatures table
    console.log('[v0] Inserting signature into admin_signatures...')
    const { data: newSignature, error: insertError } = await adminDb
      .from('admin_signatures')
      .insert(insertPayload)
      .select('id, signature_name, is_primary, created_at')
      .single()

    console.log('[v0] SUPABASE DATA:', newSignature)
    console.log('[v0] SUPABASE ERROR:', insertError)

    if (insertError) {
      console.error('[v0] CRITICAL - Insert failed with error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json({ 
        success: false,
        error: 'Database insert failed',
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 })
    }

    if (!newSignature) {
      console.error('[v0] CRITICAL - Insert succeeded but no data returned')
      return NextResponse.json({ 
        success: false,
        error: 'Insert succeeded but no data returned from database'
      }, { status: 500 })
    }

    console.log('[v0] SUCCESS - Signature created:', newSignature.id)
    return NextResponse.json({ 
      success: true, 
      data: newSignature 
    }, { status: 201 })

  } catch (err) {
    console.error('[v0] CRITICAL - Unhandled exception in POST /api/admin/signatures:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
