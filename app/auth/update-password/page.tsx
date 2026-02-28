'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/"><Image src="/logo.jpg" alt="IICAR" width={72} height={72} className="rounded-xl" priority /></Link>
          <h1 className="text-xl font-bold text-primary-foreground">Set New Password</h1>
        </div>
        <div className="rounded-2xl bg-card p-8 shadow-xl border border-border">
          <form onSubmit={handleUpdate} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" placeholder="Repeat password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
