import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'IICAR <onboarding@resend.dev>',
      to,
      subject,
      html,
    }, { idempotencyKey: `translation-notification/${to}/${subject}/${Date.now()}` })
  } catch (error) {
    console.error('[v0] Resend error:', error)
    throw error
  }
}

async function checkAdminAccess(user: any) {
  const adminDb = createAdminClient()
  const { data: profile, error } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[v0] Admin profile lookup error:', error)
    return false
  }

  return profile?.is_admin === true || user.user_metadata?.is_admin === true
}

// PATCH - Update translation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const adminDb = createAdminClient()
    const { data: translation, error: fetchError } = await adminDb
      .from('translation_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !translation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
    }

    // Determine email type based on status
    const { data: account } = await adminDb.auth.admin.getUserById(translation.user_id)
    const userEmail = account.user?.email
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/dashboard/translations/${translation.id}/checkout`
    let subject = ''
    let htmlContent = ''

    if (translation.status === 'pending' || translation.status === 'payment_initiated') {
      subject = 'Payment required for your translation request'
      htmlContent = `
        <h2>Complete payment for your translation request</h2>
        <p>Document: ${translation.document_name}</p>
        <p>Pages: ${translation.total_pages}</p>
        <p>Languages: ${translation.languages_requested.join(', ')}</p>
        <p><strong>Amount due: $${(translation.total_cost_cents / 100).toFixed(2)}</strong></p>
        <p><a href="${paymentLink}">Continue to secure payment</a></p>
      `
    } else if (translation.status === 'paid') {
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
