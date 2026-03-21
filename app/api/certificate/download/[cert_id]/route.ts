import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

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
      .select('cert_id, issued_at, final_score, student_id, program_id, revoked, certificate_level')
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

    // Add IICAR logo (decorative element only - no file system access)
    doc.setFillColor(184, 134, 11)
    doc.circle(pageWidth / 2, 24, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('IICAR', pageWidth / 2, 25.5, { align: 'center' })

    // School name (top)
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(15, 23, 42) // primary color
    doc.text('IICAR GLOBAL COLLEGE', pageWidth / 2, 50, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Institute of International Career Advancement and Recognition', pageWidth / 2, 57, { align: 'center' })

    // Certificate title with level badge
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(184, 134, 11) // gold color
    doc.text('Certificate of Completion', pageWidth / 2, 72, { align: 'center' })

    // Certificate level display
    const levelNames = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
    const levelName = levelNames[(cert.certificate_level || 1) - 1]
    const levelColors = {
      1: { r: 100, g: 150, b: 200 }, // Blue
      2: { r: 100, g: 200, b: 100 }, // Green
      3: { r: 200, g: 150, b: 50 }, // Orange
      4: { r: 200, g: 80, b: 80 }, // Red
      5: { r: 184, g: 134, b: 11 }, // Gold
    }
    const levelColor = levelColors[cert.certificate_level as keyof typeof levelColors] || levelColors[1]

    // Level badge box
    doc.setFillColor(levelColor.r, levelColor.g, levelColor.b)
    doc.rect(pageWidth / 2 - 25, 64, 50, 8, 'F')
    
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Level ${cert.certificate_level}: ${levelName}`, pageWidth / 2, 68, { align: 'center' })

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

    // Add decorative logos at bottom (text-based)
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('COL | GAOTE Certified | IICAR', 25, pageHeight - 20, { align: 'left' })
    doc.text('Accredited', pageWidth - 35, pageHeight - 20, { align: 'right' })

    // Certificate footer
    doc.setFont('times', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('COL Standard Aligned | GAOTE Certified | IICAR Standard Approved', pageWidth / 2, pageHeight - 8, { align: 'center' })

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
