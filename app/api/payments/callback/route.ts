// KopoKopo STK Push result callback
// Docs: https://api-docs.kopokopo.com/#incoming-payment-result
//
// KopoKopo POSTs the result to the callback_url when payment completes.
// The payload follows the webhook structure:
// {
//   "topic": "buygoods_transaction_received",
//   "id": "...",
//   "created_at": "...",
//   "event": {
//     "type": "Incoming Payment Request",
//     "resource": {
//       "id": "...",
//       "reference": "OEI2AK4408",       // M-Pesa transaction code
//       "status": "Success",             // "Success" | "Failed" | "Cancelled" | "Received"
//       "origination_time": "...",
//       "sender_phone_number": "+254...",
//       "amount": 20,
//       "currency": "KES",
//       "till_number": "K000000",
//       "system": "Lipa na MPESA",
//       "metadata": { payment_id: "...", program_id: "...", student_id: "..." }
//     }
//   },
//   "_links": {
//     "self": "https://sandbox.kopokopo.com/api/v1/incoming_payments/...",
//     "resource": "..."
//   }
// }

import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const adminDb = createAdminClient()

  try {
    const body = await request.json()
    console.log('[IICAR] KopoKopo callback received:', JSON.stringify(body, null, 2))

    // Extract the resource object — KopoKopo nests it under event.resource
    const resource = body?.event?.resource ?? {}
    const metadata = resource?.metadata ?? {}

    // Status strings from KopoKopo:
    // STK Push result: "Success" | "Failed" | "Cancelled"
    // Buygoods webhook: "Received" (treat as Success)
    const rawStatus = (resource?.status ?? '') as string
    const isPaid   = rawStatus === 'Success' || rawStatus === 'Received'
    const isFailed = rawStatus === 'Failed' || rawStatus === 'Cancelled'

    // M-Pesa transaction reference e.g. "OEI2AK4408"
    const reference = resource?.reference as string | undefined

    console.log('[IICAR] Payment status:', rawStatus, '| reference:', reference)
    console.log('[IICAR] Metadata:', metadata)

    // --- Strategy 1: match via payment_id stored in metadata ---
    const paymentId = metadata?.payment_id as string | undefined
    if (paymentId) {
      const updated = await updatePaymentById(adminDb, paymentId, isPaid, isFailed, reference)
      if (updated) {
        console.log('[IICAR] Payment updated via payment_id:', paymentId)
        return NextResponse.json({ received: true })
      }
    }

    // --- Strategy 2: match via kopokopo_location (self link) ---
    const selfLink = body?._links?.self as string | undefined
    if (selfLink) {
      const updated = await updatePaymentByLocation(adminDb, selfLink, isPaid, isFailed, reference)
      if (updated) {
        console.log('[IICAR] Payment updated via location:', selfLink)
        return NextResponse.json({ received: true })
      }
    }

    // --- Strategy 3: match via phone_number + pending status (last resort) ---
    const phone = resource?.sender_phone_number as string | undefined
    if (phone) {
      await updatePaymentByPhone(adminDb, phone, isPaid, isFailed, reference)
    }

    // Always return 200 so KopoKopo doesn't keep retrying
    return NextResponse.json({ received: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[IICAR] Callback error:', msg)
    return NextResponse.json({ received: true })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AdminDb = ReturnType<typeof createAdminClient>

async function updatePaymentById(
  adminDb: AdminDb,
  paymentId: string,
  isPaid: boolean,
  isFailed: boolean,
  reference?: string,
): Promise<boolean> {
  const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : 'pending'
  const { data: payment, error } = await adminDb
    .from('payments')
    .update({
      status:             newStatus,
      paid_at:            isPaid ? new Date().toISOString() : null,
      kopokopo_reference: reference ?? null,
    })
    .eq('id', paymentId)
    .neq('status', 'paid') // don't overwrite already-paid records
    .select('id, student_id, program_id, status')
    .single()

  if (error) {
    console.error('[IICAR] updatePaymentById error:', error.message)
    return false
  }

  if (isPaid && payment) {
    await activateEnrollment(adminDb, payment.student_id, payment.program_id)
  }
  return true
}

async function updatePaymentByLocation(
  adminDb: AdminDb,
  location: string,
  isPaid: boolean,
  isFailed: boolean,
  reference?: string,
): Promise<boolean> {
  const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : 'pending'
  const { data: payment, error } = await adminDb
    .from('payments')
    .update({
      status:             newStatus,
      paid_at:            isPaid ? new Date().toISOString() : null,
      kopokopo_reference: reference ?? null,
    })
    .eq('kopokopo_location', location)
    .neq('status', 'paid')
    .select('id, student_id, program_id, status')
    .single()

  if (error || !payment) return false

  if (isPaid && payment) {
    await activateEnrollment(adminDb, payment.student_id, payment.program_id)
  }
  return true
}

async function updatePaymentByPhone(
  adminDb: AdminDb,
  phone: string,
  isPaid: boolean,
  isFailed: boolean,
  reference?: string,
): Promise<void> {
  const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : 'pending'
  const { data: payment, error } = await adminDb
    .from('payments')
    .update({
      status:             newStatus,
      paid_at:            isPaid ? new Date().toISOString() : null,
      kopokopo_reference: reference ?? null,
    })
    .eq('phone_number', phone)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .select('id, student_id, program_id, status')
    .single()

  if (error) {
    console.error('[IICAR] updatePaymentByPhone error:', error.message)
    return
  }

  if (isPaid && payment) {
    await activateEnrollment(adminDb, payment.student_id, payment.program_id)
  }
}

async function activateEnrollment(
  adminDb: AdminDb,
  studentId: string,
  programId: string,
): Promise<void> {
  const { error } = await adminDb
    .from('enrollments')
    .upsert(
      {
        student_id:  studentId,
        program_id:  programId,
        status:      'active',
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,program_id' },
    )

  if (error) {
    console.error('[IICAR] Enrollment activation error:', error.message)
  } else {
    console.log('[IICAR] Enrollment activated — student:', studentId, 'program:', programId)
  }
}
