import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'
import { generateArabicDocumentHTML } from '@/lib/html-pdf-generator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type') || 'recommendation'
    const language = (searchParams.get('language') || 'ar') as RecommendationLanguage

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      )
    }

    if (!['recommendation', 'endorsement'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type - must be "recommendation" or "endorsement"' },
        { status: 400 }
      )
    }

    const adminDb = createAdminClient()

    // Fetch student profile
    const { data: student, error: studentError } = await adminDb
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Fetch all completed enrollments for this student
    const { data: enrollments, error: enrollmentsError } = await adminDb
      .from('enrollments')
      .select('id, program_id, completed_at, programs(id, title)')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (enrollmentsError || !enrollments || enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No completed enrollments found for this student' },
        { status: 404 }
      )
    }

    const translations = recommendationTranslations[language]

    // Build program list
    const programsList = enrollments.map((enrollment: any) => {
      const program = enrollment.programs as { id: string; title: string } | null
      const completedDate = enrollment.completed_at
        ? new Date(enrollment.completed_at).toLocaleDateString(
            language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          )
        : 'N/A'
      return { title: program?.title || 'Program', completedDate }
    })

    // Prepare body text
    let bodyText: string
    let conclusionText: string

    if (language === 'ar') {
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

    const generatedDate = new Date().toLocaleDateString(
      language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : 'en-GB',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )

    // Generate HTML content
    const htmlContent = generateArabicDocumentHTML({
      type: type as RecommendationType,
      studentName: student.full_name,
      programsList,
      bodyText,
      conclusionText,
      registrarName: 'Julia Thornton',
      registrarTitle: language === 'ar' ? 'مكتب المسجل' : 'Office of the Registrar',
      schoolName: language === 'ar' ? 'مدرسة IICAR المهنية' : 'IICAR Global College',
      generatedDate,
    })

    // Return HTML with proper headers for printing
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline', // Display in browser instead of download
      },
    })
  } catch (error) {
    console.error('[v0] Multi-cert document preview error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Failed to generate document preview',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
