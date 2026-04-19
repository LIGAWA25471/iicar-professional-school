import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, programId, type, language = 'en' } = body as {
      studentId: string
      programId: string
      type: RecommendationType
      language: RecommendationLanguage
    }

    if (!studentId || !programId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Fetch student profile
    const { data: student } = await adminDb
      .from('profiles')
      .select('full_name, email')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Fetch program details
    const { data: program } = await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single()

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Verify enrollment exists
    const { data: enrollment } = await adminDb
      .from('enrollments')
      .select('id, completed_at')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Student is not enrolled in this program' }, { status: 400 })
    }

    const translations = recommendationTranslations[language]

    // Generate PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Header with logo area
    doc.setFillColor(15, 23, 42) // Navy background
    doc.rect(0, 0, pageWidth, 30, 'F')

    // Title text
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(184, 134, 11) // Gold
    doc.text(translations.icarAcademy, pageWidth / 2, 15, { align: 'center' })

    // Reset for body
    doc.setTextColor(15, 23, 42)
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.text(type === 'recommendation' ? translations.recommendationTitle : translations.endorsementTitle, pageWidth / 2, 45, { align: 'center' })

    // Body content
    let yPosition = 55
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)

    // Greeting
    doc.text(translations.toWhomItMayConcern, 20, yPosition)
    yPosition += 10

    // Main body
    const bodyText = type === 'recommendation'
      ? translations.recommendationBody(student.full_name, program.title)
      : translations.endorsementBody(student.full_name, program.title)

    const splitBody = doc.splitTextToSize(bodyText, pageWidth - 40)
    doc.text(splitBody, 20, yPosition)
    yPosition += splitBody.length * 5 + 10

    // Conclusion
    if (type === 'recommendation') {
      const splitConclusion = doc.splitTextToSize(translations.conclusion, pageWidth - 40)
      doc.text(splitConclusion, 20, yPosition)
      yPosition += splitConclusion.length * 5 + 10
    }

    // Signature section
    yPosition += 10
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text(translations.sincerely, 20, yPosition)
    yPosition += 15

    // Signature line
    doc.setLineWidth(0.4)
    doc.setDrawColor(15, 23, 42)
    doc.line(20, yPosition, 70, yPosition)
    yPosition += 8

    // Name and title
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.text(translations.directorPrograms, 20, yPosition)
    yPosition += 5

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.text(translations.icarAcademy, 20, yPosition)

    // Footer with generation date
    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const generatedDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB')
    doc.text(`${translations.generatedDate} ${generatedDate}`, 20, pageHeight - 10)

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
