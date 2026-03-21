import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { PDFDocument, rgb } from 'pdf-lib'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: Request) {
  try {
    const { studentId, programId, certificateLevel } = await request.json()

    if (!studentId || !programId || !certificateLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, programId, certificateLevel' },
        { status: 400 }
      )
    }

    if (certificateLevel < 1 || certificateLevel > 5) {
      return NextResponse.json(
        { error: 'Certificate level must be between 1 and 5' },
        { status: 400 }
      )
    }

    const adminDb = createAdminClient()

    // Check if student has an enrollment for this program
    const { data: enrollment, error: enrollmentError } = await adminDb
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('[v0] Enrollment fetch error:', enrollmentError)
      return NextResponse.json(
        { error: 'No enrollment found for this student and program' },
        { status: 404 }
      )
    }

    // Check if certificate already exists
    const { data: existingCert } = await adminDb
      .from('certificates')
      .select('id, cert_id')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    let certId: string
    let certificateRecord

    if (existingCert) {
      // Update existing certificate
      certId = existingCert.cert_id
      const { data: updated, error: updateError } = await adminDb
        .from('certificates')
        .update({
          certificate_level: certificateLevel,
          issued_at: new Date().toISOString(),
        })
        .eq('id', existingCert.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update certificate: ${updateError.message}`)
      }
      certificateRecord = updated
    } else {
      // Create new certificate
      certId = `IICAR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const { data: created, error: createError } = await adminDb
        .from('certificates')
        .insert({
          student_id: studentId,
          program_id: programId,
          cert_id: certId,
          certificate_level: certificateLevel,
          issued_at: new Date().toISOString(),
          final_score: 100, // Manual issuance gets full score
          revoked: false,
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create certificate: ${createError.message}`)
      }
      certificateRecord = created
    }

    // Fetch student and program details for email
    const [{ data: studentData }, { data: programData }] = await Promise.all([
      adminDb.from('profiles').select('full_name, email').eq('id', studentId).single(),
      adminDb.from('programs').select('title').eq('id', programId).single(),
    ])

    if (!studentData?.email) {
      console.error('[v0] Student email not found')
      return NextResponse.json(
        { error: 'Student email not found' },
        { status: 400 }
      )
    }

    // Get the certificate PDF for attachment
    const pdfResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/certificate/download/${certId}`,
      { method: 'GET' }
    )

    if (!pdfResponse.ok) {
      console.error('[v0] Failed to generate certificate PDF')
      return NextResponse.json(
        { error: 'Failed to generate certificate PDF' },
        { status: 500 }
      )
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Send email with certificate attached
    const levelNames = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
    const levelName = levelNames[certificateLevel - 1]

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'certificates@iicar.org',
      to: studentData.email,
      subject: `Your IICAR Professional Certificate - ${levelName} Level`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Congratulations!</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${studentData.full_name},</p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              We are pleased to inform you that you have successfully been awarded your professional certificate in <strong>${programData?.title}</strong> at the <strong>${levelName}</strong> level.
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Your achievement demonstrates your commitment to professional development and excellence. This certificate is a testament to your dedication and hard work.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #667eea; font-weight: bold;">Certificate Details:</p>
              <p style="margin: 5px 0; color: #555;">Program: <strong>${programData?.title}</strong></p>
              <p style="margin: 5px 0; color: #555;">Level: <strong>${levelName}</strong></p>
              <p style="margin: 5px 0; color: #555;">Certificate ID: <strong>${certId}</strong></p>
              <p style="margin: 5px 0; color: #555;">Issued: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Your certificate is attached to this email. You can also download it anytime from your dashboard.
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Best regards,<br />
              <strong>IICAR Professional School</strong>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `IICAR_Certificate_${certId}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    })

    console.log('[v0] Certificate issued and email sent:', certId)

    return NextResponse.json({
      success: true,
      message: 'Certificate issued successfully',
      certificateId: certificateRecord.id,
      certId: certId,
      email: studentData.email,
    })
  } catch (error) {
    console.error('[v0] Error issuing certificate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue certificate' },
      { status: 500 }
    )
  }
}
