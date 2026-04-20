import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const signatureName = formData.get('signatureName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!signatureName) {
      return NextResponse.json({ error: 'No signature name provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`signatures/${user.id}/${signatureName}-${Date.now()}`, file, {
      access: 'public',
    })

    console.log('[v0] Signature uploaded to Blob:', blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (err) {
    console.error('[v0] Error uploading to blob:', err)
    return NextResponse.json({ 
      error: 'Failed to upload signature',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
