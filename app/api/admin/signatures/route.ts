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
    console.log('[v0] Request body received:', {
      has_signature_type: !!body.signature_type,
      signature_type: body.signature_type,
      has_signature_data: !!body.signature_data,
      signature_data_length: body.signature_data?.length,
      has_signature_name: !!body.signature_name,
      signature_name: body.signature_name
    })

    // Step 2: Validate request fields exist
    console.log('[v0] Validating required fields...')
    if (!body.signature_type) {
      console.warn('[v0] Validation failed: missing signature_type')
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed',
        field: 'signature_type',
        message: 'signature_type is required'
      }, { status: 400 })
    }
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
    if (!['upload', 'drawn', 'typed'].includes(body.signature_type)) {
      console.warn('[v0] Validation failed: invalid signature_type:', body.signature_type)
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed',
        field: 'signature_type',
        message: `Must be 'upload', 'drawn', or 'typed', got: ${body.signature_type}`
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

    // Step 4: Initialize admin client
    console.log('[v0] Initializing admin client...')
    const adminDb = createAdminClient()

    // Step 5: Deactivate other signatures
    console.log('[v0] Deactivating other active signatures...')
    const { error: deactivateError, count: deactivateCount } = await adminDb
      .from('signatures')
      .update({ is_active: false })
      .eq('is_active', true)
    
    if (deactivateError) {
      console.warn('[v0] Warning - Could not deactivate other signatures:', deactivateError.message)
      // Don't fail on this - just warn
    } else {
      console.log('[v0] Deactivated', deactivateCount || 0, 'signatures')
    }

    // Step 6: Prepare data for insert
    console.log('[v0] Preparing data for insert...')
    const insertData = {
      user_id: user.id,
      signature_type: body.signature_type,
      signature_data: String(body.signature_data),
      signature_name: body.signature_name.trim(),
      is_active: true
    }
    console.log('[v0] Insert payload:', {
      user_id: insertData.user_id,
      signature_type: insertData.signature_type,
      signature_name: insertData.signature_name,
      signature_data_length: insertData.signature_data.length,
      is_active: insertData.is_active
    })

    // Step 7: Insert new signature
    console.log('[v0] Inserting signature into database...')
    const { data: newSignature, error: insertError } = await adminDb
      .from('signatures')
      .insert([insertData])
      .select('id, signature_type, signature_name, is_active, created_at, signature_data')
      .single()

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
