import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { initiateSTKPush } from '@/lib/kopokopo'

async function sendEnrollmentNotification(email: string, studentName: string, programTitle: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org'}/api/email/enrollment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, studentName, programTitle }),
    })
  } catch (err) {
    console.error('[v0] Failed to send enrollment notification:', err)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    // Verify caller is admin
    const { data: adminProfile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { studentId, programId, paymentMethod, phoneNumber } = await request.json()
    if (!studentId || !programId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Enroll request:', { studentId, programId, paymentMethod, phoneNumber })

    // Fetch program for price
    const { data: program } = await adminDb
      .from('programs')
      .select('id, title, price_cents')
      .eq('id', programId)
      .single()
    console.log('[v0] Program found:', program ? `${program.title} (${program.id})` : 'NOT FOUND')
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    // Fetch student profile including email
    const { data: studentProfile, error: profileError } = await adminDb
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', studentId)
      .single()
    console.log('[v0] Student profile query:', { studentId, found: !!studentProfile, error: profileError?.message })
    if (!studentProfile) {
      // Try to check if student exists in auth but not profiles
      const { data: authList } = await adminDb.auth.admin.listUsers()
      const authExists = authList?.users.some(u => u.id === studentId)
      return NextResponse.json({
        error: `Student not found (ID: ${studentId})${authExists ? ' - exists in auth but no profile created yet' : ' - does not exist in database'}`,
      }, { status: 404 })
    }

    // Get student email from auth
    const { data: authUsers } = await adminDb.auth.admin.listUsers()
    const studentAuthUser = authUsers?.users.find(u => u.id === studentId)
    const studentEmail = studentAuthUser?.email

    if (paymentMethod === 'already_paid') {
      // Upsert enrollment as active immediately
      const { error: enrollError } = await adminDb
        .from('enrollments')
        .upsert({
          student_id:  studentId,
          program_id:  programId,
          status:      'active',
          enrolled_at: new Date().toISOString(),
        }, { onConflict: 'student_id,program_id' })

      if (enrollError) throw enrollError

      // Create a paid payment record for audit trail
      await adminDb.from('payments').insert({
        student_id:   studentId,
        program_id:   programId,
        amount_cents: program.price_cents,
        currency:     'KES',
        status:       'paid',
        paid_at:      new Date().toISOString(),
        kopokopo_reference: 'ADMIN_MANUAL',
      })

      // Send enrollment email
      if (studentEmail) {
        await sendEnrollmentNotification(studentEmail, studentProfile.full_name || 'Student', program.title)
      }

      return NextResponse.json({
        success: true,
        message: `${studentProfile.full_name} enrolled in ${program.title} successfully.`,
      })
    }

    if (paymentMethod === 'mpesa_prompt') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number is required for M-Pesa prompt' }, { status: 400 })
      }

      // Normalise phone to E.164
      const digits = String(phoneNumber).replace(/\D/g, '')
      let e164: string | null = null
      if (digits.startsWith('254') && digits.length === 12) {
        e164 = `+${digits}`
      } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
        e164 = `+254${digits}`
      } else if (digits.startsWith('07') || digits.startsWith('01')) {
        e164 = `+254${digits.slice(1)}`
      }
      if (!e164) {
        return NextResponse.json({ error: 'Invalid phone number. Use format 0712345678.' }, { status: 400 })
      }

      const nameParts = (studentProfile.full_name ?? 'Student').trim().split(' ')
      const firstName = nameParts[0] ?? 'Student'
      const lastName  = nameParts.slice(1).join(' ') || 'User'
      const amountKes = Math.round(program.price_cents / 100)

      // Create pending enrollment
      await adminDb
        .from('enrollments')
        .upsert({
          student_id: studentId,
          program_id: programId,
          status:     'pending',
        }, { onConflict: 'student_id,program_id' })

      // Create pending payment record
      const { data: payment, error: paymentError } = await adminDb
        .from('payments')
        .insert({
          student_id:   studentId,
          program_id:   programId,
          amount_cents: program.price_cents,
          currency:     'KES',
          status:       'pending',
          phone_number: e164,
        })
        .select('id')
        .single()

      if (paymentError) throw paymentError

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://iicar.org').replace(/\/$/, '')
      const callbackUrl = `${appUrl}/api/payments/callback`

      const result = await initiateSTKPush({
        firstName,
        lastName,
        phoneNumber: e164,
        amount: amountKes,
        callbackUrl,
        metadata: {
          payment_id: payment.id,
          program_id: programId,
          student_id: studentId,
        },
      })

      await adminDb
        .from('payments')
        .update({ kopokopo_location: result.location })
        .eq('id', payment.id)

      return NextResponse.json({
        success:   true,
        paymentId: payment.id,
        message:   `M-Pesa prompt sent to ${e164}. Student will be enrolled once payment is confirmed.`,
      })
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[IICAR] Admin enroll error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
