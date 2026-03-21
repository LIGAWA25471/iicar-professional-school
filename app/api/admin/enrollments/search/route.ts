import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const programId = searchParams.get('programId')
    const search = searchParams.get('search')

    const adminDb = createAdminClient()

    if (studentId && programId) {
      // Get specific enrollment with details
      const { data: enrollment, error: enrollmentError } = await adminDb
        .from('enrollments')
        .select(`
          id,
          status,
          created_at,
          student_id,
          program_id,
          profiles(full_name, email),
          programs(title, description)
        `)
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .single()

      if (enrollmentError) {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        )
      }

      // Check if certificate already exists
      const { data: existingCert } = await adminDb
        .from('certificates')
        .select('id, cert_id, certificate_level, issued_at')
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .single()

      return NextResponse.json({
        enrollment,
        existingCertificate: existingCert,
      })
    }

    if (search) {
      // Search students by name or email
      const { data: profiles, error: profilesError } = await adminDb
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10)

      if (profilesError) {
        throw new Error(profilesError.message)
      }

      // For each student, get their enrollments
      const profilesWithEnrollments = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: enrollments } = await adminDb
            .from('enrollments')
            .select('id, program_id, status, programs(title)')
            .eq('student_id', profile.id)

          return {
            ...profile,
            enrollments: enrollments || [],
          }
        })
      )

      return NextResponse.json(profilesWithEnrollments)
    }

    // Get all completed/active enrollments with student details
    const { data: enrollments, error: enrollmentsError } = await adminDb
      .from('enrollments')
      .select(`
        id,
        status,
        created_at,
        student_id,
        program_id,
        profiles(full_name, email),
        programs(title)
      `)
      .in('status', ['active', 'completed'])
      .limit(50)
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      throw new Error(enrollmentsError.message)
    }

    // Get certificate info for each enrollment
    const enrollmentsWithCerts = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const { data: cert } = await adminDb
          .from('certificates')
          .select('id, cert_id, certificate_level, issued_at')
          .eq('student_id', enrollment.student_id)
          .eq('program_id', enrollment.program_id)
          .single()

        return {
          ...enrollment,
          existingCertificate: cert,
        }
      })
    )

    return NextResponse.json(enrollmentsWithCerts)
  } catch (error) {
    console.error('[v0] Error fetching enrollments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
