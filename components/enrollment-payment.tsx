'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Phone, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export function EnrollmentPayment({
  programId,
  programTitle,
  amount,
  onSuccess,
}: {
  programId: string
  programTitle: string
  amount: number
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promptSent, setPromptSent] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [pollStatus, setPollStatus] = useState<'pending' | 'paid' | 'failed'>('pending')
  const [pollCount, setPollCount] = useState(0)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, phoneNumber, amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      setPaymentId(data.paymentId)
      setPromptSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setLoading(false)
    }
  }

  // Poll payment status every 5 seconds after prompt is sent
  const checkStatus = useCallback(async () => {
    if (!paymentId) return
    try {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.status === 'paid') {
        setPollStatus('paid')
        if (onSuccess) onSuccess()
        setTimeout(() => router.refresh(), 1500)
      } else if (data.status === 'failed') {
        setPollStatus('failed')
      }
    } catch { /* silent */ }
  }, [paymentId, onSuccess, router])

  useEffect(() => {
    if (!promptSent || !paymentId || pollStatus !== 'pending') return
    // Poll up to 24 times (2 minutes)
    if (pollCount >= 24) return
    const timer = setTimeout(() => {
      checkStatus()
      setPollCount(c => c + 1)
    }, 5000)
    return () => clearTimeout(timer)
  }, [promptSent, paymentId, pollStatus, pollCount, checkStatus])

  if (pollStatus === 'paid') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Payment Confirmed</h3>
            <p className="mt-1 text-sm text-green-800">
              You are now enrolled in {programTitle}. Redirecting...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pollStatus === 'failed') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Payment Failed</h3>
            <p className="mt-1 text-sm text-red-800">
              The payment was not completed. Please try again.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => { setPromptSent(false); setPaymentId(null); setPollStatus('pending'); setPollCount(0); setError('') }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (promptSent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
        <div className="flex gap-3 items-start">
          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="font-semibold text-foreground">M-Pesa Prompt Sent</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your phone <span className="font-mono font-semibold">{phoneNumber}</span> and enter your M-Pesa PIN to pay{' '}
              <span className="font-semibold text-foreground">KES {amount.toLocaleString()}</span> for {programTitle}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Waiting for payment confirmation...
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-xs text-muted-foreground"
          onClick={() => { setPromptSent(false); setPaymentId(null); setPollStatus('pending'); setPollCount(0); setError('') }}
        >
          Use a different number
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="font-semibold text-foreground">Complete Enrollment</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay KES {amount.toLocaleString()} to enroll in {programTitle}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">M-Pesa Phone Number</label>
        <div className="mt-2 flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="tel"
            placeholder="0712345678 or 254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
            className="font-mono"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          We will send an M-Pesa STK push prompt to this number
        </p>
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !phoneNumber.trim()}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending M-Pesa Prompt...
          </>
        ) : (
          `Pay KES ${amount.toLocaleString()} via M-Pesa`
        )}
      </Button>
    </form>
  )
}
