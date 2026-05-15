import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recommendationTranslations, type RecommendationLanguage, type RecommendationType } from '@/lib/recommendation-translations'
import { generateArabicDocumentHTML } from '@/lib/html-pdf-generator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const programId = searchParams.get('programId')
    const type = searchParams.get('type') || 'recommendation'
    const language = (searchParams.get('language') || 'ar') as RecommendationLanguage

    if (!studentId || !programId) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId and programId' },
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

    // Fetch program details
    const { data: program, error: programError } = await adminDb
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Verify enrollment exists
    const { data: enrollment, error: enrollmentError } = await adminDb
      .from('enrollments')
      .select('id, completed_at')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this program' },
        { status: 400 }
      )
    }

    const translations = recommendationTranslations[language]

    // Prepare body text
    let bodyText: string
    let conclusionText: string

    if (language === 'ar') {
      bodyText = type === 'recommendation'
        ? `أظهر ${student.full_name} طوال فترة البرنامج التزاماً استثنائياً بالتعلم والتطور المهني، وإتقاناً تقنياً ملحوظاً، وفهماً شاملاً لمحتوى المقرر الدراسي. كما أظهر ${student.full_name} باستمرار أخلاقيات عمل قوية جداً وقدرات متميزة في حل المشاكل والقدرة الفعّالة على تطبيق المعرفة النظرية على الحالات العملية الحقيقية. كان تعاونه مع زملائه والمدربين احترافياً وفعّالاً، مما أسهم بشكل إيجابي ملحوظ في بيئة التعلم والدراسة.`
        : `من خلال إكمال برنامج شهادة ${program.title} بنجاح، أظهر ${student.full_name} مستويات عالية جداً من الكفاءة التقنية والإتقان الكامل للممارسات الصناعية الحديثة والمتقدمة. تشمل المهارات والمعارف المكتسبة الكفاءات التقنية المتقدمة والمنهجيات المهنية الحديثة وأفضل الممارسات المعترف بها في المجال.`

      conclusionText = 'أنا واثق تماماً من أن هذا الشخص سيقدم مساهمات قيمة وفعّالة وملموسة لأي منظمة أو مؤسسة، وأنا متاح ومستعد لمناقشة مؤهلاته وكفاءاته بمزيد من التفاصيل والتوضيح عند الحاجة والطلب.'
    } else {
      bodyText = type === 'recommendation'
        ? translations.recommendationBody(student.full_name, program.title)
        : translations.endorsementBody(student.full_name, program.title)
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
      programTitle: program.title,
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
    console.error('[v0] Document preview error:', error)
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
