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

    const translations = recommendationTranslations[language]

    // Generate combined PDF
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

    // Introduction
    doc.setFontSize(11)
    const introText = type === 'recommendation'
      ? `This letter of recommendation is provided for ${student.full_name}, who has successfully completed the following professional certification program(s) at IICAR Professional School:`
      : `This professional endorsement is provided for ${student.full_name}, who has successfully completed and demonstrated competency in the following professional certification program(s) at IICAR Professional School:`

    const splitIntro = doc.splitTextToSize(introText, pageWidth - 40)
    doc.text(splitIntro, 20, yPosition)
    yPosition += splitIntro.length * 5 + 8

    // List all completed programs
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
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
      yPosition += 6
    })

    yPosition += 5

    // Main body text
    const bodyText = type === 'recommendation'
      ? `Throughout these professional development programs, ${student.full_name} demonstrated exceptional commitment to learning, outstanding technical proficiency, and comprehensive understanding of the subject matter. ${student.full_name} consistently displayed strong work ethic, excellent problem-solving abilities, and the capacity to apply theoretical knowledge to practical situations.\n\nThe completion of these multiple certifications demonstrates ${student.full_name}'s dedication to professional development and mastery of diverse professional competencies. This individual is well-prepared to apply these skills in professional roles requiring specialized expertise and leadership qualities.`
      : `Through the completion of these professional certification programs, ${student.full_name} has demonstrated exceptional technical proficiency and mastery of industry-relevant practices across multiple specialized domains. The skills and knowledge acquired through these comprehensive programs include advanced technical competencies, professional methodologies, and best practices in multiple fields.\n\n${student.full_name} has proven the ability to apply these competencies effectively in professional contexts and to continue developing expertise independently. These multiple certifications represent verified achievement of professional standards and readiness for advancement in multiple professional domains.`

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
    doc.setLineWidth(0.5)
    doc.setDrawColor(15, 23, 42)
    doc.line(20, yPosition, 70, yPosition)
    yPosition += 2

    // Signature placeholder
    doc.setFont('times', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('[Registrar Signature]', 20, yPosition)
    yPosition += 10

    // Name and title
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(translations.registrar, 20, yPosition)
    yPosition += 5

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.text(translations.icarAcademy, 20, yPosition)

    // Footer
    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const generatedDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB')
    doc.text(`${translations.generatedDate} ${generatedDate}`, 20, pageHeight - 10)

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
