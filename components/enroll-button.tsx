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

      console.log('[v0] Enrolling student in free course:', { studentId: user.id, programId, title })

      const { data, error } = await supabase.from('enrollments').insert({
        student_id: user.id,
        program_id: programId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })

      console.log('[v0] Enrollment response:', { data, error })

      if (error) {
        // If enrollment exists, that's fine - they're already enrolled
        if (error.code === '23505') {
          console.log('[v0] Student already enrolled in this course')
          router.push(`/dashboard/programs/${programId}`)
          router.refresh()
          return
        }
        throw error
      }

      console.log('[v0] Enrollment successful, redirecting...')
      router.push(`/dashboard/programs/${programId}`)
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Enrollment failed'
      setError(errorMsg)
      console.error('[v0] Free enrollment error:', err)
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

