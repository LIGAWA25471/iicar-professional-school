'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function RevokeCertButton({ certId }: { certId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  async function revoke() {
    if (!confirmed) { setConfirmed(true); return }
    
    setLoading(true)
    setError('')
    try {
      console.log('[v0] Revoking certificate:', certId)
      const res = await fetch('/api/admin/revoke-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId }),
      })
      
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to revoke certificate')
        setLoading(false)
        return
      }
      
      console.log('[v0] Certificate revoked successfully')
      setConfirmed(false)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      console.error('[v0] Revoke error:', msg)
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={revoke} 
        disabled={loading}
        className={`text-xs ${confirmed ? 'text-destructive hover:text-destructive border border-destructive/30' : 'text-muted-foreground'}`}>
        {loading ? 'Revoking…' : confirmed ? 'Confirm Revoke' : 'Revoke'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

