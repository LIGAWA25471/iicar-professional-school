import React from 'next'
'use client'

import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function NewsletterSubscription() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [preferences, setPreferences] = useState({
    marketing: true,
    promotions: true,
    newPrograms: true,
  })

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          preferences,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to subscribe')
        return
      }

      setSuccess(true)
      setEmail('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <form onSubmit={handleSubscribe} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/90 text-slate-900 placeholder:text-slate-500"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || success}
            className="bg-white text-blue-600 hover:bg-slate-100 px-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <Check className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox
              id="marketing"
              checked={preferences.marketing}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, marketing: !!checked }))
              }
              className="border-white/30"
            />
            <Label htmlFor="marketing" className="text-blue-100 cursor-pointer">
              Marketing & tips
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="promotions"
              checked={preferences.promotions}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, promotions: !!checked }))
              }
              className="border-white/30"
            />
            <Label htmlFor="promotions" className="text-blue-100 cursor-pointer">
              Special promotions
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="newPrograms"
              checked={preferences.newPrograms}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, newPrograms: !!checked }))
              }
              className="border-white/30"
            />
            <Label htmlFor="newPrograms" className="text-blue-100 cursor-pointer">
              New programs & courses
            </Label>
          </div>
        </div>

        {error && <p className="text-red-200 text-sm">{error}</p>}
        {success && <p className="text-green-200 text-sm">Thanks for subscribing!</p>}
      </form>
    </div>
  )
}
