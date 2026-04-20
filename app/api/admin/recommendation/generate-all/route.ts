import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, type, language = 'en' } = body

    if (!studentId || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { studentId, type, language }
      }, { status: 400 })
    }

    if (!['recommendation', 'endorsement'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type - must be "recommendation" or "endorsement"' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Fetch student profile
    const { data: student, error: studentError } = await adminDb
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      console.error('[v0] Student fetch error:', studentError)
      return NextResponse.json({ error: 'Student not found', details: studentError?.message }, { status: 404 })
    }

    // Fetch all completed enrollments with program details
    const { data: enrollments, error: enrollmentsError } = await adminDb
      .from('enrollments')
      .select('id, completed_at, program_id, programs(id, title)')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })

    if (enrollmentsError) {
      console.error('[v0] Enrollments fetch error:', enrollmentsError)
      return NextResponse.json({ error: 'Failed to fetch enrollments', details: enrollmentsError?.message }, { status: 400 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ error: 'No completed certifications found for this student' }, { status: 400 })
    }

    // Fetch active (primary) signature for the document
    const { data: activeSignature } = await adminDb
      .from('admin_signatures')
      .select('signature_data, signature_name')
      .eq('is_primary', true)
      .single()

    // Process signature data (no blob URL conversion needed since data is stored directly)
    let processedSignature = activeSignature

    const translations = recommendationTranslations[language]

    // Generate combined PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Professional Header with Navy Background
    doc.setFillColor(15, 23, 42) // Navy blue
    doc.rect(0, 0, pageWidth, 45, 'F')

    // Add decorative gold line
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(2)
    doc.line(0, 45, pageWidth, 45)

    // Institution Name in Gold
    doc.setFont('times', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text('IICAR GLOBAL COLLEGE', pageWidth / 2, 12, { align: 'center' })

    // Subtitle
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(184, 134, 11)
    doc.text('Professional School Division', pageWidth / 2, 18, { align: 'center' })

    // Document Type Title - Centered below header
    doc.setFont('times', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42)
    doc.text(type === 'recommendation' ? translations.recommendationTitle : translations.endorsementTitle, pageWidth / 2, 57, { align: 'center' })

    // Decorative line under title
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(50, 61, pageWidth - 50, 61)

    // Body content with proper margins
    let yPosition = 70
    doc.setFont('georgia', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)

    // Greeting
    doc.text(translations.toWhomItMayConcern, 25, yPosition)
    yPosition += 8

    // Introduction
    doc.setFont('georgia', 'normal')
    doc.setFontSize(11)
    const introText = type === 'recommendation'
      ? translations.multipleRecommendationIntro(student.full_name)
      : translations.multipleEndorsementIntro(student.full_name)

    const splitIntro = doc.splitTextToSize(introText, pageWidth - 50)
    doc.text(splitIntro, 25, yPosition)
    yPosition += splitIntro.length * 4 + 12

    // List all completed programs with better formatting
    doc.setFont('georgia', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    
    enrollments.forEach((enrollment: any, index: number) => {
      const program = enrollment.programs as { id: string; title: string } | null
      const completedDate = enrollment.completed_at 
        ? new Date(enrollment.completed_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'
      
      const bulletText = `${index + 1}. ${program?.title || 'Program'} (Completed: ${completedDate})`
      doc.text(bulletText, 30, yPosition)
      yPosition += 7
    })

    yPosition += 8

    // Main body text
    const bodyText = type === 'recommendation'
      ? translations.multipleRecommendationBody(student.full_name)
      : translations.multipleEndorsementBody(student.full_name)

    const splitBody = doc.splitTextToSize(bodyText, pageWidth - 50)
    doc.text(splitBody, 25, yPosition)
    yPosition += splitBody.length * 4 + 15

    // Conclusion
    if (type === 'recommendation') {
      const splitConclusion = doc.splitTextToSize(translations.conclusion, pageWidth - 50)
      doc.text(splitConclusion, 25, yPosition)
      yPosition += splitConclusion.length * 4 + 15
    } else {
      yPosition += 10
    }

    // Signature Section
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text(translations.sincerely, 25, yPosition)
    yPosition += 15

    // Add signature (if available)
    if (processedSignature) {
      try {
        if (processedSignature.signature_data?.startsWith('data:image')) {
          // Display image signature
          try {
            doc.addImage(processedSignature.signature_data, 'PNG', 25, yPosition - 2, 50, 10)
            yPosition += 12
          } catch (imgErr) {
            console.log('[v0] Could not add image signature, using line')
            doc.setDrawColor(15, 23, 42)
            doc.setLineWidth(0.7)
            doc.line(25, yPosition, 75, yPosition)
            yPosition += 8
          }
        } else {
          // Display typed signature
          doc.setFont('times', 'italic')
          doc.setFontSize(14)
          doc.setTextColor(15, 23, 42)
          doc.text(processedSignature.signature_data, 25, yPosition)
          yPosition += 10
        }
      } catch (err) {
        console.log('[v0] Error adding signature:', err)
        doc.setDrawColor(15, 23, 42)
        doc.setLineWidth(0.7)
        doc.line(25, yPosition, 75, yPosition)
        yPosition += 8
      }
    } else {
      // Default signature line if no signature on file
      doc.setDrawColor(15, 23, 42)
      doc.setLineWidth(0.7)
      doc.line(25, yPosition, 75, yPosition)
      yPosition += 8
    }

    // Registrar name
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('Julia Thornton', 25, yPosition)
    yPosition += 6

    // Registrar title
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Office of the Registrar', 25, yPosition)
    yPosition += 4
    doc.text('IICAR Global College', 25, yPosition)

    // Footer with decorative elements
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(25, pageHeight - 18, pageWidth - 25, pageHeight - 18)

    // Footer text
    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    const generatedDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    doc.text(`${translations.generatedDate} ${generatedDate}`, pageWidth / 2, pageHeight - 12, { align: 'center' })

    // Document reference ID
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    const documentId = `${type.substring(0, 3)}-all-${language}`
    doc.text(`Document ID: ${documentId}`, pageWidth / 2, pageHeight - 8, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="combined_${type}_${student.full_name.replace(/\s+/g, '_')}_${language}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[v0] Error generating combined recommendation:', error)
    return NextResponse.json({ error: 'Failed to generate document', details: String(error) }, { status: 500 })
  }
}
