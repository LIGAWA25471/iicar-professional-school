'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SeedProgramsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seed-programs', { method: 'GET' })
      const data = await res.json()

      if (res.ok) {
        console.log('[v0] Seeded programs:', data)
        router.refresh()
      } else {
        console.error('[v0] Seed error:', data.error)
      }
    } catch (err) {
      console.error('[v0] Seed request failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Seeding...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Load Sample Programs
        </>
      )}
    </Button>
  )
}
