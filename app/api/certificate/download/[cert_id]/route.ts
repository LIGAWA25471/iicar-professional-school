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
      .select('cert_id, issued_at, final_score, student_id, program_id, profiles(full_name), programs(title)')
      .eq('cert_id', cert_id.toUpperCase())
      .single()

    if (error || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

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

    // Border (dark goldenrod)
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(3)
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

    // Inner border
    doc.setLineWidth(1)
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24)

    // School name (top)
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(184, 134, 11)
    doc.text('IICAR', pageWidth / 2, 35, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    doc.text('International Institute for Certified Administrative Resources', pageWidth / 2, 42, { align: 'center' })

    // Certificate title
    doc.setFont('times', 'bold')
    doc.setFontSize(32)
    doc.setTextColor(0, 0, 0)
    doc.text('Certificate of Completion', pageWidth / 2, 62, { align: 'center' })

    // Decorative line
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(50, 68, pageWidth - 50, 68)

    // Certificate body text
    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)

    doc.text('This is to certify that', pageWidth / 2, 80, { align: 'center' })

    // Student name
    doc.setFont('times', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    const studentName = cert.profiles && typeof cert.profiles === 'object' && 'full_name' in cert.profiles 
      ? cert.profiles.full_name 
      : 'Unknown Student'
    doc.text(studentName, pageWidth / 2, 92, { align: 'center' })

    // Body text continued
    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('has successfully completed the professional certification program in', pageWidth / 2, 105, { align: 'center' })

    // Program title
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    const programTitle = cert.programs && typeof cert.programs === 'object' && 'title' in cert.programs
      ? cert.programs.title
      : 'Professional Development'
    doc.text(programTitle, pageWidth / 2, 115, { align: 'center' })

    // Score
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    if (cert.final_score) {
      doc.text(`Final Score: ${cert.final_score}%`, pageWidth / 2, 127, { align: 'center' })
    }

    // Date issued
    const issueDate = new Date(cert.issued_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    doc.text(`Issued: ${issueDate}`, pageWidth / 2, 135, { align: 'center' })

    // Certificate ID
    doc.setFont('courier', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Certificate ID: ${cert.cert_id}`, pageWidth / 2, 148, { align: 'center' })

    // Signature section with principal name
    doc.setLineWidth(0.5)
    
    // Left signature line (Authorized)
    doc.line(30, 165, 60, 165)
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Authorized Signature', 45, 170, { align: 'center' })
    
    // Right signature area (Principal Malinar Hellen)
    // Add signature line
    doc.line(pageWidth - 60, 160, pageWidth - 30, 160)
    
    // Add principal name and title
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text('Malinar Hellen', pageWidth - 45, 168, { align: 'center' })
    
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    doc.text('Principal, IICAR', pageWidth - 45, 175, { align: 'center' })

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

