'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete ${userName}? This permanently removes their account and cannot be undone.`)) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete user')
      router.refresh()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete user')
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={loading} className="text-destructive hover:text-destructive">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Delete {userName}</span>
    </Button>
  )
}
