import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    return await resend.emails.send({
      from: 'IICAR Translations <noreply@iicar.org>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('[v0] Resend error:', error)
    throw error
  }
}

async function checkAdminAccess(user: any) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin
}

// PATCH - Update translation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await checkAdminAccess(user)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: translation, error: updateError } = await adminDb
      .from('translation_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'processing' && { processing_started_at: new Date().toISOString() }),
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Error updating translation:', updateError)
      return NextResponse.json({ error: 'Failed to update translation' }, { status: 500 })
    }

    return NextResponse.json({ translation })
  } catch (error) {
    console.error('[v0] Translation update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send email notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await checkAdminAccess(user)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get translation request and user email
    const { data: translation, error: fetchError } = await supabase
      .from('translation_requests')
      .select(`
        *,
        user:auth.users(email)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !translation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
    }

    // Determine email type based on status
    const userEmail = translation.user?.email
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    let subject = ''
    let htmlContent = ''

    if (translation.status === 'paid') {
      subject = 'Translation Request Confirmation'
      htmlContent = `
        <h2>Your translation request has been confirmed</h2>
        <p>Document: ${translation.document_name}</p>
        <p>Languages: ${translation.languages_requested.join(', ')}</p>
        <p>Pages: ${translation.total_pages}</p>
        <p>We will process your translation and send you the results within 24-72 hours.</p>
      `
    } else if (translation.status === 'processing') {
      subject = 'Your Translation is Being Processed'
      htmlContent = `
        <h2>Translation Processing Started</h2>
        <p>Your document is now being translated.</p>
        <p>You will receive your translated files shortly.</p>
      `
    } else if (translation.status === 'completed') {
      subject = 'Your Translation is Ready!'
      htmlContent = `
        <h2>Your Translation is Complete</h2>
        <p>Document: ${translation.document_name}</p>
        <p>Your translated documents are now available for download.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/translations/${translation.id}">View Your Translations</a></p>
      `
    } else if (translation.status === 'failed') {
      subject = 'Translation Request - Action Required'
      htmlContent = `
        <h2>Your translation request needs attention</h2>
        <p>Document: ${translation.document_name}</p>
        <p>Please contact our support team for assistance.</p>
      `
    }

    if (!subject) {
      return NextResponse.json({ error: 'Invalid status for email notification' }, { status: 400 })
    }

    // Send email
    const emailResponse = await sendEmail(userEmail, subject, htmlContent)

    if (emailResponse.error) {
      console.error('[v0] Email send error:', emailResponse.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    console.log('[v0] Email sent successfully:', emailResponse.data?.id)

    return NextResponse.json({
      status: 'success',
      message: 'Email sent successfully',
      emailId: emailResponse.data?.id,
    })
  } catch (error) {
    console.error('[v0] Send email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
