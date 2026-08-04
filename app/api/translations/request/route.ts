import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

const PRICE_PER_PAGE_PER_LANGUAGE_CENTS = 2500 // $25

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const pages = parseInt(formData.get('pages') as string)
    const languages = JSON.parse(formData.get('languages') as string) as string[]

    if (!file || !fileName || !pages || pages < 1 || !languages || languages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Processing translation request:', { fileName, pages, languages, userId: user.id })

    // Upload file to Blob Storage
    const buffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const blobFileName = `translations/${user.id}/${timestamp}-${fileName}`

    const uploadedFile = await put(blobFileName, buffer, {
      access: 'public',
    })

    console.log('[v0] File uploaded to Blob:', uploadedFile.url)

    // Calculate total cost
    const totalCostCents = pages * languages.length * PRICE_PER_PAGE_PER_LANGUAGE_CENTS

    // Create translation request record using admin client to bypass RLS
    const adminDb = createAdminClient()
    const { data: translationRequest, error: createError } = await adminDb
      .from('translation_requests')
      .insert({
        user_id: user.id,
        document_name: fileName,
        document_file_url: uploadedFile.url,
        total_pages: pages,
        languages_requested: languages,
        total_cost_cents: totalCostCents,
        status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] Error creating translation request:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create request',
          details: createError?.message || 'Database error'
        }, 
        { status: 500 }
      )
    }

    console.log('[v0] Translation request created:', translationRequest.id)

    return NextResponse.json({
      success: true,
      requestId: translationRequest.id,
      amount: totalCostCents,
      message: 'Translation request created successfully',
    })
  } catch (error) {
    console.error('[v0] Translation request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
