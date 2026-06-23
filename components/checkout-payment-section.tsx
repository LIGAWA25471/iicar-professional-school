'use client'

import { useRouter } from 'next/navigation'
import { PaystackPayment } from '@/components/paystack-payment'

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
    <PaystackPayment
      programId={programId}
      programTitle={programTitle}
      amount={amount}
      onSuccess={handleSuccess}
    />
  )
}
