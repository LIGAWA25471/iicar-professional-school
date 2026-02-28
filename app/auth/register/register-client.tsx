'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Ghana', 'Nigeria',
  'South Africa', 'Egypt', 'United Kingdom', 'United States', 'Canada',
  'Australia', 'India', 'Other',
]

export default function RegisterPageClient() {
  const searchParams = useSearchParams()
  const programId = searchParams.get('program')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/confirm${programId ? `?program=${programId}` : ''}`
      : '/auth/confirm'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName, phone, country },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-10 shadow-xl text-center flex flex-col items-center gap-4">
          <Image src="/logo.jpg" alt="IICAR" width={64} height={64} className="rounded-xl" />
          <h2 className="text-xl font-bold text-primary">Check Your Email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <strong>{email}</strong>. Please verify your email to activate your account.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/">
            <Image src="/logo.jpg" alt="IICAR" width={72} height={72} className="rounded-xl" />
          </Link>
          <h1 className="text-xl font-bold text-primary-foreground">Create Your IICAR Account</h1>
          <p className="text-sm text-primary-foreground/60">Start your journey to professional certification</p>
        </div>
        <div className="rounded-2xl bg-card p-8 shadow-xl border border-border">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName}
                onChange={e => setFullName(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="e.g. +254712345678" value={phone}
                onChange={e => setPhone(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={country}
                onChange={e => setCountry(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>

            {error && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
