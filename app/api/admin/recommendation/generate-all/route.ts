import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'
import { generatePDFFromHTML, generateRecommendationHTML } from '@/lib/pdf-generator'

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

    const translations = recommendationTranslations[language]

    // Build program list
    const programsList = enrollments.map((enrollment: any) => {
      const program = enrollment.programs as { id: string; title: string } | null
      const completedDate = enrollment.completed_at 
        ? new Date(enrollment.completed_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'
      return { title: program?.title || 'Program', completedDate }
    })

    // Get body text
    let bodyText: string
    if (language === 'ar') {
      bodyText = type === 'recommendation'
        ? `Throughout these professional development programs, ${student.full_name} demonstrated exceptional commitment to learning, outstanding technical proficiency, and comprehensive understanding of the subject matter. ${student.full_name} consistently displayed strong work ethic, excellent problem-solving abilities, and the capacity to apply theoretical knowledge to practical situations.\n\nThe completion of these multiple certifications demonstrates ${student.full_name}'s dedication to professional development and mastery of diverse professional competencies. This individual is well-prepared to apply these skills in professional roles requiring specialized expertise and leadership qualities.`
        : `Through the completion of these professional certification programs, ${student.full_name} has demonstrated exceptional technical proficiency and mastery of industry-relevant practices across multiple specialized domains. The skills and knowledge acquired through these comprehensive programs include advanced technical competencies, professional methodologies, and best practices in multiple fields.\n\n${student.full_name} has proven the ability to apply these competencies effectively in professional contexts and to continue developing expertise independently. These multiple certifications represent verified achievement of professional standards and readiness for advancement in multiple professional domains.`
    } else {
      bodyText = type === 'recommendation'
        ? translations.multipleRecommendationBody(student.full_name)
        : translations.multipleEndorsementBody(student.full_name)
    }

    const conclusionText = language === 'ar'
      ? 'I am confident that this individual will make a valuable contribution to any organization and am available to discuss their qualifications in further detail upon request.'
      : translations.conclusion

    const generatedDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Generate HTML content for PDF
    const htmlContent = generateRecommendationHTML({
      type: type as RecommendationType,
      language: language as RecommendationLanguage,
      studentName: student.full_name,
      bodyText,
      conclusionText,
      registrarName: 'Julia Thornton',
      registrarTitle: 'Office of the Registrar',
      schoolName: 'IICAR Global College',
      generatedDate,
      programsList,
    })

    // Generate PDF from HTML with proper Arabic support
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      language: language as RecommendationLanguage,
    })

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
