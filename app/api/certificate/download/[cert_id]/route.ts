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
    
    console.log('[v0] Downloading certificate:', { cert_id: cert_id.toUpperCase() })
    
    // Query certificates table without joins (this works reliably)
    const { data: certs, error } = await adminDb
      .from('certificates')
      .select('*')
      .eq('cert_id', cert_id.toUpperCase())

    if (error) {
      console.error('[v0] Certificate query error:', error)
      return NextResponse.json({ error: 'Certificate not found', details: error.message }, { status: 404 })
    }

    if (!certs || certs.length === 0) {
      console.error('[v0] Certificate not found:', cert_id.toUpperCase())
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const cert = certs[0]
    console.log('[v0] Certificate found:', { cert_id: cert.cert_id, issued_at: cert.issued_at })

    // Only allow download of issued certificates
    if (!cert.issued_at) {
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    // Fetch profile data separately
    let profile = null
    if (cert.student_id) {
      const { data: profiles } = await adminDb
        .from('profiles')
        .select('full_name')
        .eq('id', cert.student_id)
      
      profile = profiles && profiles.length > 0 ? profiles[0] : null
    }

    // Fetch program data separately
    let program = null
    if (cert.program_id) {
      const { data: programs } = await adminDb
        .from('programs')
        .select('title')
        .eq('id', cert.program_id)
      
      program = programs && programs.length > 0 ? programs[0] : null
    }

    console.log('[v0] Certificate data prepared:', { 
      cert_id: cert.cert_id, 
      student: profile?.full_name, 
      program: program?.title 
    })

    // Generate beautiful professional PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Premium background gradient effect with decorative shapes
    // Top accent bar (navy blue)
    doc.setFillColor(15, 23, 42) // Navy blue
    doc.rect(0, 0, pageWidth, 12, 'F')

    // Background color (cream white)
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 12, pageWidth, pageHeight - 12, 'F')

    // Elegant left border accent (gold)
    doc.setFillColor(184, 134, 11) // Gold
    doc.rect(0, 12, 3, pageHeight - 12, 'F')

    // Premium border frame
    doc.setDrawColor(184, 134, 11) // Gold
    doc.setLineWidth(2)
    doc.rect(10, 20, pageWidth - 20, pageHeight - 40)

    // Decorative corner elements - top left
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(10, 20, 25, 20)
    doc.line(10, 20, 10, 32)

    // Decorative corner elements - bottom right
    doc.line(pageWidth - 10, pageHeight - 20, pageWidth - 25, pageHeight - 20)
    doc.line(pageWidth - 10, pageHeight - 20, pageWidth - 10, pageHeight - 32)

    // IICAR Institution Header
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(15, 23, 42) // Navy
    doc.text('IICAR GLOBAL COLLEGE', pageWidth / 2, 38, { align: 'center' })

    // Subtitle
    doc.setFont('times', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Institute of International Career Advancement and Recognition', pageWidth / 2, 44, { align: 'center' })

    // Decorative line under header
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(1.5)
    doc.line(45, 47, pageWidth - 45, 47)

    // Main certificate title with premium styling
    doc.setFont('times', 'bold')
    doc.setFontSize(32)
    doc.setTextColor(184, 134, 11) // Gold
    doc.text('Certificate of Achievement', pageWidth / 2, 62, { align: 'center' })

    // Secondary line
    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text('Professional Certification', pageWidth / 2, 68, { align: 'center' })

    // Decorative divider
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(60, 71, pageWidth - 60, 71)

    // Certificate body text
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text('This prestigious certificate is awarded to', pageWidth / 2, 83, { align: 'center' })

    // Student name - prominent display
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(15, 23, 42) // Navy
    const studentName = profile?.full_name || 'Valued Student'
    const splitName = doc.splitTextToSize(studentName, pageWidth - 40)
    doc.text(splitName, pageWidth / 2, 95, { align: 'center' })

    // Certificate text continued
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text('for successfully completing the professional certification in', pageWidth / 2, 110, { align: 'center' })

    // Program title - highlighted
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(184, 134, 11) // Gold
    const programTitle = program?.title || 'Professional Development Program'
    const splitProgram = doc.splitTextToSize(programTitle, pageWidth - 50)
    doc.text(splitProgram, pageWidth / 2, 120, { align: 'center' })

    // Achievement level and performance metrics
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)

    const issueDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
    const levelName = LEVEL_NAMES[(cert.certificate_level || 1) - 1]

    // Create metrics section
    let metricsY = 132
    
    // Score box (if available)
    if (cert.final_score) {
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.5)
      doc.rect(30, metricsY - 2, 35, 8)
      
      doc.setFont('times', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(184, 134, 11)
      doc.text(`Final Score: ${cert.final_score}%`, 32, metricsY + 3, { align: 'left' })
      metricsY += 12
    }

    // Certificate level box
    doc.setDrawColor(15, 23, 42)
    doc.setLineWidth(0.5)
    doc.rect(30, metricsY - 2, 35, 8)
    
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(`Level ${cert.certificate_level || 1}: ${levelName}`, 32, metricsY + 3, { align: 'left' })

    // Issue date box
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.rect(pageWidth - 65, metricsY - 2, 35, 8)
    
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Issued: ${issueDate}`, pageWidth - 63, metricsY + 3, { align: 'left' })

    // Certificate ID and verification
    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`Certificate ID: ${cert.cert_id}`, pageWidth / 2, pageHeight - 28, { align: 'center' })
    
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Verify Certificate: https://iicar.org/verify', pageWidth / 2, pageHeight - 24, { align: 'center' })

    // Signature section with premium styling
    const sigY = pageHeight - 38
    const sigLineY = sigY - 5

    // Left signature block - Authorized Signatory
    doc.setLineWidth(0.4)
    doc.setDrawColor(15, 23, 42)
    doc.line(20, sigLineY, 60, sigLineY)
    
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('_________________________', 40, sigY - 2, { align: 'center' })
    
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('Authorized Signatory', 40, sigY + 4, { align: 'center' })
    
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Director, Programs', 40, sigY + 8, { align: 'center' })

    // Right signature block - Principal
    doc.setLineWidth(0.4)
    doc.setDrawColor(15, 23, 42)
    doc.line(pageWidth - 60, sigLineY, pageWidth - 20, sigLineY)
    
    doc.setFont('times', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('_________________________', pageWidth - 40, sigY - 2, { align: 'center' })
    
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Malinar Hellen', pageWidth - 40, sigY + 4, { align: 'center' })
    
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Principal, IICAR', pageWidth - 40, sigY + 8, { align: 'center' })

    // Footer certification statement
    doc.setFont('times', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('This certificate recognizes demonstrated excellence and proficiency in professional development.', 
      pageWidth / 2, pageHeight - 2, { align: 'center' })

    // Generate PDF buffer
    const pdfBytes = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfBytes)

    // Return as downloadable PDF file with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cert.cert_id}_certificate.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    console.error('[v0] Certificate PDF error:', err)
    return NextResponse.json({ error: 'Failed to generate certificate PDF' }, { status: 500 })
  }
}
