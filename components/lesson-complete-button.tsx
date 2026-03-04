'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface Props {
  lessonId: string
  programId: string
  completed: boolean
}

export default function LessonCompleteButton({ lessonId, programId, completed: initialCompleted }: Props) {
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function markComplete() {
    if (completed) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/lesson/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to mark complete')
      setLoading(false)
      return
    }

    setCompleted(true)
    setLoading(false)
    router.refresh()
    router.push(`/dashboard/programs/${programId}`)
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={markComplete}
        disabled={completed || loading}
        className={completed
          ? 'bg-green-600 text-white cursor-default hover:bg-green-600'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'}
      >
        {completed ? (
          <><CheckCircle className="mr-2 h-4 w-4" /> Completed</>
        ) : loading ? 'Saving…' : 'Mark Complete'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
