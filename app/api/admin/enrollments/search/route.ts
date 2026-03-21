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
      console.log('[v0] Searching for:', search)
      const { data: profiles, error: profilesError } = await adminDb
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10)

      if (profilesError) {
        console.error('[v0] Profile search error:', profilesError)
        throw new Error(profilesError.message)
      }

      console.log('[v0] Found profiles:', profiles?.length)

      // For each student, get their enrollments
      const profilesWithEnrollments = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const { data: enrollments, error: enrollError } = await adminDb
              .from('enrollments')
              .select('id, status, program_id, programs(title)')
              .eq('student_id', profile.id)

            if (enrollError) {
              console.error('[v0] Enrollment fetch error for', profile.id, ':', enrollError)
              return {
                ...profile,
                enrollments: [],
              }
            }

            // Get certificate info for each enrollment
            const enrollmentsWithCerts = await Promise.all(
              (enrollments || []).map(async (enrollment: any) => {
                const { data: cert } = await adminDb
                  .from('certificates')
                  .select('id, cert_id, certificate_level, issued_at')
                  .eq('student_id', profile.id)
                  .eq('program_id', enrollment.program_id)
                  .single()

                return {
                  ...enrollment,
                  existingCertificate: cert,
                }
              })
            )

            return {
              ...profile,
              enrollments: enrollmentsWithCerts || [],
            }
          } catch (err) {
            console.error('[v0] Error processing profile:', err)
            return {
              ...profile,
              enrollments: [],
            }
          }
        })
      )

      console.log('[v0] Returning profiles with enrollments:', profilesWithEnrollments.length)
      return NextResponse.json(profilesWithEnrollments)
    }

    // Get all active/completed enrollments with student details
    console.log('[v0] Fetching all active/completed enrollments')
    const { data: enrollments, error: enrollmentsError } = await adminDb
      .from('enrollments')
      .select('id, status, student_id, program_id, created_at')
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (enrollmentsError) {
      console.error('[v0] Enrollments fetch error:', enrollmentsError)
      throw new Error(enrollmentsError.message)
    }

    console.log('[v0] Found enrollments:', enrollments?.length)

    // Group enrollments by student and fetch profile + program info
    const studentMap = new Map()
    
    for (const enrollment of enrollments || []) {
      if (!studentMap.has(enrollment.student_id)) {
        // Fetch student profile
        const { data: profile, error: profileError } = await adminDb
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', enrollment.student_id)
          .single()

        if (!profileError && profile) {
          studentMap.set(enrollment.student_id, {
            ...profile,
            enrollments: [],
          })
        }
      }

      // Fetch program info
      const { data: program } = await adminDb
        .from('programs')
        .select('id, title')
        .eq('id', enrollment.program_id)
        .single()

      // Fetch certificate info
      const { data: cert } = await adminDb
        .from('certificates')
        .select('id, cert_id, certificate_level, issued_at')
        .eq('student_id', enrollment.student_id)
        .eq('program_id', enrollment.program_id)
        .single()

      const student = studentMap.get(enrollment.student_id)
      if (student) {
        student.enrollments.push({
          id: enrollment.id,
          status: enrollment.status,
          program_id: enrollment.program_id,
          programs: program,
          existingCertificate: cert,
        })
      }
    }

    const result = Array.from(studentMap.values())
    console.log('[v0] Returning students:', result.length)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Error fetching enrollments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
