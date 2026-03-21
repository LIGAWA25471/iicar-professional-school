import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cert_id: string }> }
) {
  const { cert_id } = await params
  if (!cert_id) return NextResponse.json({ error: 'No certificate ID provided' }, { status: 400 })

  try {
    const adminDb = createAdminClient()
    const { data: cert, error } = await adminDb
      .from('certificates')
      .select('cert_id, issued_at, final_score, student_id, program_id, revoked')
      .eq('cert_id', cert_id.toUpperCase())
      .single()

    if (error || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Only allow download of issued certificates (issued_at is not null)
    if (cert.issued_at === null) {
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    // Fetch student and program details
    const [{ data: studentData }, { data: programData }] = await Promise.all([
      adminDb.from('profiles').select('full_name').eq('id', cert.student_id).single(),
      adminDb.from('programs').select('title').eq('id', cert.program_id).single(),
    ])

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Background color (light gold)
    doc.setFillColor(255, 251, 235)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Outer border (dark goldenrod)
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(3)
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16)

    // Inner border
    doc.setLineWidth(1)
    doc.rect(11, 11, pageWidth - 22, pageHeight - 22)

    // Add IICAR logo (if file exists)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath)
        const logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`
        doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - 12, 18, 24, 24)
      }
    } catch (logoErr) {
      console.error('[v0] Logo not found, skipping:', logoErr)
    }

    // School name (top)
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(15, 23, 42) // primary color
    doc.text('IICAR GLOBAL COLLEGE', pageWidth / 2, 50, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Institute of International Career Advancement and Recognition', pageWidth / 2, 57, { align: 'center' })

    // Certificate title
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(184, 134, 11) // gold color
    doc.text('Certificate of Completion', pageWidth / 2, 72, { align: 'center' })

    // Decorative line
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(60, 78, pageWidth - 60, 78)

    // Certificate body text
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text('This is to certify that', pageWidth / 2, 90, { align: 'center' })

    // Student name
    doc.setFont('times', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(15, 23, 42)
    const studentName = studentData?.full_name || 'Valued Graduate'
    doc.text(studentName, pageWidth / 2, 102, { align: 'center' })

    // Body text continued
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text('has successfully completed the professional certification program in', pageWidth / 2, 114, { align: 'center' })

    // Program title
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    const programTitle = programData?.title || 'Professional Development'
    doc.text(programTitle, pageWidth / 2, 125, { align: 'center' })

    // Score and date
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)

    const issueDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    if (cert.final_score) {
      doc.text(`Final Score: ${cert.final_score}%  |  Issued: ${issueDate}`, pageWidth / 2, 137, { align: 'center' })
    } else {
      doc.text(`Issued: ${issueDate}`, pageWidth / 2, 137, { align: 'center' })
    }

    // Certificate ID
    doc.setFont('courier', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Certificate ID: ${cert.cert_id}`, pageWidth / 2, 145, { align: 'center' })
    doc.text('Verify at: https://iicar.org/verify', pageWidth / 2, 150, { align: 'center' })

    // Signature section
    const sigY = 162
    const sigLineY = sigY - 2

    // Primary signature (left side) - Default authorized signature
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.line(30, sigLineY, 80, sigLineY)
    
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Authorized Signature', 55, sigY + 5, { align: 'center' })

    // Secondary signature (right side) - Principal
    doc.line(pageWidth - 80, sigLineY, pageWidth - 30, sigLineY)
    
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Malinar Hellen', pageWidth - 55, sigY + 5, { align: 'center' })
    
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Principal, IICAR', pageWidth - 55, sigY + 10, { align: 'center' })

    // Add COL and GAOTE logos at bottom
    try {
      const colLogoPath = path.join(process.cwd(), 'public', 'col-logo.png')
      const gaoteLogoPath = path.join(process.cwd(), 'public', 'gaote-logo.png')
      
      if (fs.existsSync(colLogoPath)) {
        const colData = fs.readFileSync(colLogoPath)
        const colBase64 = `data:image/png;base64,${colData.toString('base64')}`
        doc.addImage(colBase64, 'PNG', 20, pageHeight - 25, 30, 12)
      }
      
      if (fs.existsSync(gaoteLogoPath)) {
        const gaoteData = fs.readFileSync(gaoteLogoPath)
        const gaoteBase64 = `data:image/png;base64,${gaoteData.toString('base64')}`
        doc.addImage(gaoteBase64, 'PNG', pageWidth - 40, pageHeight - 25, 20, 18)
      }
    } catch (partnerLogoErr) {
      console.error('[v0] Partner logos not found, skipping:', partnerLogoErr)
    }

    // Bottom text
    doc.setFont('times', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('COL Standard Aligned | GAOTE Certified | GAOTE Standard Approved', pageWidth / 2, pageHeight - 12, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cert.cert_id}_certificate.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[v0] Certificate PDF error:', err)
    return NextResponse.json({ error: 'Failed to generate certificate PDF' }, { status: 500 })
  }
}
