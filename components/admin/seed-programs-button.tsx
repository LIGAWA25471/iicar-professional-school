'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'

export default function SeedProgramsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSeed() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/seed-programs', { method: 'POST' })
      const data = await res.json()
      setMessage(data.message ?? data.error ?? 'Done')
      if (res.ok) router.refresh()
    } catch {
      setMessage('Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleSeed}
        disabled={loading}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/5"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding…</>
        ) : (
          <><Database className="mr-2 h-4 w-4" /> Seed 30 Sample Programs</>
        )}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
