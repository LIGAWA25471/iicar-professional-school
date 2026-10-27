import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    return await resend.emails.send({
      from: 'IICAR <info@iicar.org>',
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
    const paymentDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000)
    const deadlineLabel = paymentDeadline.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
    let subject = ''
    let htmlContent = ''

    if (translation.status === 'pending' || translation.status === 'payment_initiated') {
      subject = 'Complete your IICAR translation payment within 12 hours'
      htmlContent = `
        <div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#172033;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(18,42,66,.08);">
            <div style="background:#123b5d;padding:30px 34px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:#b9d8ee;font-weight:700;">IICAR TRANSLATIONS</div>
              <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Your payment is ready</h1>
              <p style="margin:10px 0 0;color:#d8e8f4;font-size:15px;line-height:1.6;">Complete your translation request securely from your dashboard.</p>
            </div>
            <div style="padding:32px 34px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello,</p>
              <p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">We have received your translation request and it is ready for payment.</p>
              <div style="background:#f7fafc;border:1px solid #e2eaf1;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:#718096;font-weight:700;margin-bottom:8px;">REQUEST DETAILS</div>
                <div style="font-size:17px;font-weight:700;margin-bottom:10px;">${translation.document_name}</div>
                <div style="font-size:14px;color:#536174;line-height:1.8;">${translation.total_pages} pages<br>${translation.languages_requested.join(' · ')}</div>
              </div>
              <div style="border:1px solid #cfe2f0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;background:#f8fcff;">
                <div style="font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:#58758d;font-weight:700;">AMOUNT DUE</div>
                <div style="font-size:34px;line-height:1.2;font-weight:800;color:#123b5d;margin:8px 0;">$${(translation.total_cost_cents / 100).toFixed(2)}</div>
                <div style="font-size:13px;color:#64748b;">Payment window closes ${deadlineLabel}</div>
              </div>
              <div style="text-align:center;margin:28px 0 24px;"><a href="${paymentLink}" style="display:inline-block;background:#d49a32;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:15px 30px;border-radius:8px;">Continue to payment</a></div>
              <p style="margin:0;color:#718096;font-size:13px;line-height:1.7;text-align:center;">This payment link is reserved for your request for 12 hours. If you need help, reply to this email or contact IICAR support.</p>
            </div>
            <div style="border-top:1px solid #edf1f5;padding:18px 34px;color:#8a97a8;font-size:12px;line-height:1.6;text-align:center;">International Institute for Certified Administrative Resources<br>© ${new Date().getFullYear()} IICAR</div>
          </div>
        </div>
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
      return NextResponse.json({
        error: emailResponse.error.message || 'Failed to send email',
      }, { status: 502 })
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
