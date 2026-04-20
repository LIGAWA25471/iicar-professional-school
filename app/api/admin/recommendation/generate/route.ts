import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[v0] Recommendation request body:', body)
    
    const { studentId, programId, type, language = 'en' } = body

    if (!studentId || !programId || !type) {
      console.error('[v0] Missing required fields:', { studentId, programId, type })
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { studentId, programId, type, language }
      }, { status: 400 })
    }

    if (!['recommendation', 'endorsement'].includes(type)) {
      console.error('[v0] Invalid type:', type)
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

    // Fetch program details
    const { data: program, error: programError } = await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      console.error('[v0] Program fetch error:', programError)
      return NextResponse.json({ error: 'Program not found', details: programError?.message }, { status: 404 })
    }

    // Verify enrollment exists
    const { data: enrollment, error: enrollmentError } = await adminDb
      .from('enrollments')
      .select('id, completed_at')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('[v0] Enrollment verification error:', enrollmentError)
      return NextResponse.json({ error: 'Student is not enrolled in this program', details: enrollmentError?.message }, { status: 400 })
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

    // Generate PDF
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

    // Main body text with better formatting
    const bodyText = type === 'recommendation'
      ? translations.recommendationBody(student.full_name, program.title)
      : translations.endorsementBody(student.full_name, program.title)

    const maxWidth = pageWidth - 50 // 25mm left margin + 25mm right margin
    const splitBody = doc.splitTextToSize(bodyText, maxWidth)
    doc.text(splitBody, 25, yPosition)
    yPosition += splitBody.length * 4 + 10

    // Conclusion paragraph
    if (type === 'recommendation') {
      const splitConclusion = doc.splitTextToSize(translations.conclusion, maxWidth)
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
          // Display image signature (base64 PNG)
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
          doc.setFont('georgia', 'bold')
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
    yPosition += 5
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
    const documentId = `${studentId.substring(0, 8)}-${type.substring(0, 3)}-${language}`
    doc.text(`Document ID: ${documentId}`, pageWidth / 2, pageHeight - 8, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Record recommendation in database
    const recType = type === 'recommendation' ? 'recommendation' : 'endorsement'
    await adminDb
      .from('recommendations')
      .upsert({
        student_id: studentId,
        program_id: programId,
        recommendation_type: recType,
        language,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,program_id,recommendation_type,language'
      })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${student.full_name}_${type}_${language}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[v0] Recommendation generation error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 })
  }
}
