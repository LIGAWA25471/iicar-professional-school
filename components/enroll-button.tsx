'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  programId: string
  price: number
  title: string
}

export default function EnrollButton({ programId, price, title }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFreeEnroll() {
    setLoading(true)
    setError('')

    try {
      // Free: create enrollment directly
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to enroll')
        setLoading(false)
        return
      }

      await supabase.from('enrollments').upsert({
        student_id: user.id,
        program_id: programId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'student_id,program_id' })

      router.push(`/dashboard/programs/${programId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed')
      setLoading(false)
    }
  }

  if (price === 0) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button onClick={handleFreeEnroll} disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
          {loading ? 'Enrolling…' : 'Enroll Free'}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  // Paid: redirect to checkout page
  return (
    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
      <Link href={`/dashboard/programs/${programId}/checkout`}>
        Proceed to Checkout
      </Link>
    </Button>
  )
}

