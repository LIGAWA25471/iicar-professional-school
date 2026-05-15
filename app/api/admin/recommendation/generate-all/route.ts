import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'
import { generatePDFFromHTML, generateArabicDocumentHTML, generateEnglishDocumentHTML } from '@/lib/html-pdf-generator'

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

    // Build program list for multi-cert documents
    const programsList = enrollments.map((enrollment: any) => {
      const program = enrollment.programs as { id: string; title: string } | null
      const completedDate = enrollment.completed_at 
        ? new Date(enrollment.completed_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : language === 'ar' ? 'ar-SA' : 'en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'
      return { title: program?.title || 'Program', completedDate }
    })

    // Prepare body text
    let bodyText: string
    let conclusionText: string

    if (language === 'ar') {
      // Arabic body text for multi-cert
      bodyText = type === 'recommendation'
        ? `طوال هذه البرامج المتعددة للتطوير والتدريب المهني، أظهر ${student.full_name} التزاماً استثنائياً بالتعلم والتطور المستمر، وإتقاناً تقنياً ملحوظاً جداً، وفهماً شاملاً وعميقاً للمواضيع والموضوعات المختلفة والمتنوعة. وأظهر ${student.full_name} باستمرار أخلاقيات عمل قوية جداً وقدرات متميزة وممتازة في حل المشاكل المعقدة والصعبة.`
        : `من خلال إكمال هذه البرامج المتعددة والمختلفة للشهادات المهنية، أظهر ${student.full_name} مستويات عالية جداً من الكفاءة التقنية والإتقان الكامل للممارسات الصناعية الحديثة والمتقدمة والمتطورة عبر مجالات متخصصة ومتعددة ومختلفة.`

      conclusionText = 'أنا واثق تماماً من أن هذا الشخص سيقدم مساهمات قيمة وفعّالة وملموسة لأي منظمة أو مؤسسة.'
    } else {
      bodyText = type === 'recommendation'
        ? translations.multipleRecommendationBody(student.full_name)
        : translations.multipleEndorsementBody(student.full_name)
      conclusionText = translations.conclusion
    }

    // Generate PDF based on language
    let pdfBuffer: Buffer

    if (language === 'ar') {
      // Use HTML rendering for Arabic with Puppeteer
      const generatedDate = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const htmlContent = generateArabicDocumentHTML({
        type: type as RecommendationType,
        studentName: student.full_name,
        programsList,
        bodyText,
        conclusionText,
        registrarName: 'Julia Thornton',
        registrarTitle: 'مكتب المسجل',
        schoolName: 'مدرسة IICAR المهنية',
        generatedDate,
      })

      pdfBuffer = await generatePDFFromHTML(htmlContent)
    } else {
      // Use jsPDF for other languages (legacy support)
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

      const titleText = type === 'recommendation' ? translations.recommendationTitle : translations.endorsementTitle

      doc.text(titleText, pageWidth / 2, 57, { align: 'center' })

      // Decorative line under title
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.5)
      doc.line(50, 61, pageWidth - 50, 61)

      // Body content with proper margins
      let yPosition = 70
      const maxWidth = pageWidth - 50 // 25mm left + 25mm right margins
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

      const splitIntro = doc.splitTextToSize(introText, maxWidth)
      doc.text(splitIntro, 25, yPosition)
      yPosition += splitIntro.length * 4 + 12

      // List all completed programs with text wrapping and page break handling
      doc.setFont('georgia', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      
      const pageBreakThreshold = pageHeight - 40 // Leave room for signature section
      
      enrollments.forEach((enrollment: any, index: number) => {
        const program = enrollment.programs as { id: string; title: string } | null
        const completedDate = programsList[index]?.completedDate || 'N/A'
        
        // Wrap long program titles and dates
        const bulletText = `${index + 1}. ${program?.title || 'Program'} (Completed: ${completedDate})`
        const wrappedBullet = doc.splitTextToSize(bulletText, maxWidth - 10)
        
        // Check if we need a page break
        if (yPosition + wrappedBullet.length * 4 > pageBreakThreshold) {
          doc.addPage()
          yPosition = 30
        }
        
        doc.text(wrappedBullet, 30, yPosition)
        yPosition += wrappedBullet.length * 4 + 2
      })

      yPosition += 8

      // Main body text
      const splitBody = doc.splitTextToSize(bodyText, maxWidth)
      
      // Check if body text needs a new page
      if (yPosition + splitBody.length * 4 + 15 > pageBreakThreshold) {
        doc.addPage()
        yPosition = 30
      }
      
      doc.text(splitBody, 25, yPosition)
      yPosition += splitBody.length * 4 + 15

      // Conclusion
      if (type === 'recommendation') {
        const splitConclusion = doc.splitTextToSize(conclusionText, maxWidth)
        
        // Check if conclusion needs a new page
        if (yPosition + splitConclusion.length * 4 + 15 > pageBreakThreshold) {
          doc.addPage()
          yPosition = 30
        }
        
        doc.text(splitConclusion, 25, yPosition)
        yPosition += splitConclusion.length * 4 + 15
      } else {
        yPosition += 10
      }

      // Signature Section - ensure it stays on the same page
      if (yPosition + 40 > pageBreakThreshold) {
        doc.addPage()
        yPosition = 30
      }
      
      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text(translations.sincerely, 25, yPosition)
      yPosition += 15

      // Add signature placeholder (no active signature for multi-cert)
      doc.setDrawColor(15, 23, 42)
      doc.setLineWidth(0.7)
      doc.line(25, yPosition, 75, yPosition)
      yPosition += 8

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
      pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    }

    // Record recommendation in database
    const recType = type === 'recommendation' ? 'recommendation' : 'endorsement'
    await adminDb
      .from('recommendations')
      .upsert({
        student_id: studentId,
        recommendation_type: recType,
        language,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,recommendation_type,language'
      })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${student.full_name}_${type}_all_courses_${language}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[v0] Recommendation generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
