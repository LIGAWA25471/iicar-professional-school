import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'
import { generatePDFFromHTML, generateRecommendationHTML } from '@/lib/pdf-generator'

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

    const translations = recommendationTranslations[language]

    // Get body text - use translations for non-Arabic, English fallback for Arabic
    let bodyText: string
    if (language === 'ar') {
      bodyText = type === 'recommendation'
        ? `I am pleased to provide this letter of recommendation for ${student.full_name}, who has successfully completed the professional certification in ${program.title} at IICAR Professional School. Throughout the program, ${student.full_name} demonstrated exceptional commitment to learning, outstanding technical proficiency, and a comprehensive grasp of the course material.\n\n${student.full_name} consistently displayed a strong work ethic, excellent problem-solving abilities, and the capacity to apply theoretical knowledge to practical situations. Their engagement with peers and instructors was professional and collaborative, contributing positively to the learning environment.\n\nThe competencies acquired during this certification program have prepared ${student.full_name} to excel in professional roles requiring specialized expertise and leadership qualities. Based on the demonstrated performance and achievements throughout the program, I am confident that ${student.full_name} possesses the knowledge, skills, and character to succeed in advancing their professional career.`
        : `This is to certify that ${student.full_name} has successfully completed and demonstrated professional competency and mastery in the ${program.title} certification program offered by IICAR Professional School. Throughout the intensive training and assessment process, ${student.full_name} exhibited exceptional technical proficiency and a thorough understanding of industry-relevant practices.\n\nThe skills and knowledge acquired include advanced technical competencies, professional methodologies, and best practices in the field. ${student.full_name} has proven the ability to apply these competencies effectively in professional contexts and to continue developing expertise independently.\n\nWe hereby endorse ${student.full_name}'s professional qualifications and competency in ${program.title}. This certification represents a verified achievement of professional standards and readiness for advancement in the field.`
    } else {
      bodyText = type === 'recommendation'
        ? translations.recommendationBody(student.full_name, program.title)
        : translations.endorsementBody(student.full_name, program.title)
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
      programTitle: program.title,
      bodyText,
      conclusionText,
      registrarName: 'Julia Thornton',
      registrarTitle: 'Office of the Registrar',
      schoolName: 'IICAR Global College',
      generatedDate,
    })

    // Generate PDF from HTML with proper Arabic support
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      language: language as RecommendationLanguage,
    })

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
