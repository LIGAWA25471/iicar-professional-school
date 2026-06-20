'use client'

import { useRouter } from 'next/navigation'
import { EnrollmentPayment } from '@/components/enrollment-payment'

interface CheckoutPaymentSectionProps {
  programId: string
  programTitle: string
  amount: number
}

export function CheckoutPaymentSection({
  programId,
  programTitle,
  amount,
}: CheckoutPaymentSectionProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push(`/dashboard/programs/${programId}`)
    router.refresh()
  }

  return (
    <EnrollmentPayment
      programId={programId}
      programTitle={programTitle}
      amount={amount}
      onSuccess={handleSuccess}
    />
  )
}
