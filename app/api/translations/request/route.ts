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

    // This project is connected to a public Blob store. Keep only the pathname in
    // the database so the storage implementation can be changed without rewriting requests.
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

    const { data: account } = await adminDb.auth.admin.getUserById(user.id)
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/dashboard/translations/${translationRequest.id}/checkout`
    const paymentDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000)
    const deadlineLabel = paymentDeadline.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Nairobi',
    }) + ' EAT'
    if (account.user?.email) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error: emailError } = await resend.emails.send({
        from: 'IICAR <info@iicar.org>',
        to: account.user.email,
        subject: 'Complete your IICAR translation payment within 12 hours',
        html: `
          <div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#172033;">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(18,42,66,.08);">
              <div style="background:#123b5d;padding:30px 34px;color:#ffffff;"><div style="font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:#b9d8ee;font-weight:700;">IICAR TRANSLATIONS</div><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Your payment is ready</h1><p style="margin:10px 0 0;color:#d8e8f4;font-size:15px;line-height:1.6;">Complete your translation request securely from your dashboard.</p></div>
              <div style="padding:32px 34px;"><p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello,</p><p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7;">We have received your translation request and it is ready for payment.</p>
                <div style="background:#f7fafc;border:1px solid #e2eaf1;border-radius:12px;padding:20px;margin-bottom:24px;"><div style="font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:#718096;font-weight:700;margin-bottom:8px;">REQUEST DETAILS</div><div style="font-size:17px;font-weight:700;margin-bottom:10px;">${fileName}</div><div style="font-size:14px;color:#536174;line-height:1.8;">Translation request</div></div>
                <div style="border:1px solid #cfe2f0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;background:#f8fcff;"><div style="font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:#58758d;font-weight:700;">AMOUNT DUE</div><div style="font-size:34px;line-height:1.2;font-weight:800;color:#123b5d;margin:8px 0;">$${(totalCostCents / 100).toFixed(2)}</div><div style="font-size:13px;color:#64748b;">Payment window closes ${deadlineLabel}</div></div>
                <div style="text-align:center;margin:28px 0 24px;"><a href="${paymentLink}" style="display:inline-block;background:#d49a32;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:15px 30px;border-radius:8px;">Continue to payment</a></div><p style="margin:0;color:#718096;font-size:13px;line-height:1.7;text-align:center;">This payment link is reserved for your request for 12 hours. If you need help, reply to this email or contact IICAR support.</p></div>
              <div style="border-top:1px solid #edf1f5;padding:18px 34px;color:#8a97a8;font-size:12px;line-height:1.6;text-align:center;">International Institute for Certified Administrative Resources<br>© ${new Date().getFullYear()} IICAR</div>
            </div>
          </div>
        `,
      }, { idempotencyKey: `translation-payment-request/${translationRequest.id}` })
      if (emailError) console.error('[v0] Translation payment email error:', emailError)
    }

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
