'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    // Use full domain for production — adjust based on environment
    const redirectTo = 'https://iicar.org/auth/update-password'
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/"><Image src="/logo.jpg" alt="IICAR" width={72} height={72} className="rounded-xl" priority /></Link>
          <h1 className="text-xl font-bold text-primary-foreground">Reset Your Password</h1>
        </div>
        <div className="rounded-2xl bg-card p-8 shadow-xl border border-border">
          {sent ? (
            <div className="text-center flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">A reset link has been sent to <strong>{email}</strong>. Check your inbox.</p>
              <Button asChild variant="outline"><Link href="/auth/login">Back to Sign In</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
