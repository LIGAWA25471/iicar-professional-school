'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

declare global {
  interface Window {
    PaystackPop: any
  }
}

export function PaystackPayment({
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
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [scriptReady, setScriptReady] = useState(false)

  // Convert KES amount to USD for display (1 USD = 134 KES)
  const amountInUSD = Math.round(amount / 134)
  const amountInKES = amount

  // Load Paystack script with proper async handling
  useEffect(() => {
    // Check if script already exists
    if (window.PaystackPop) {
      setScriptReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    
    script.onload = () => {
      if (window.PaystackPop) {
        setScriptReady(true)
        console.log('[v0] Paystack script loaded successfully')
      }
    }
    
    script.onerror = () => {
      console.error('[v0] Failed to load Paystack script')
      setError('Failed to load payment system. Please refresh and try again.')
    }
    
    document.body.appendChild(script)
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !fullName.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Wait for script to be ready
    if (!scriptReady || !window.PaystackPop) {
      setError('Payment system is loading. Please wait a moment and try again.')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      // Initialize payment on the backend
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          email,
          fullName,
          amount: amountInKES,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed')
      }

      console.log('[v0] Opening Paystack checkout with reference:', data.reference)

      // Open Paystack checkout
      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: email,
        amount: amountInKES * 100, // Paystack expects amount in kobo (cents)
        currency: 'KES',
        ref: data.reference,
        onClose: function () {
          console.log('[v0] Paystack modal closed')
          setPaymentStatus('idle')
          setLoading(false)
        },
        onSuccess: function (transaction: any) {
          console.log('[v0] Payment successful:', transaction)
          setPaymentStatus('success')
          if (onSuccess) onSuccess()
          setTimeout(() => {
            router.push(`/dashboard/programs/${programId}`)
            router.refresh()
          }, 2000)
        },
      })
      
      // Make sure handler has openIframe method
      if (typeof handler.openIframe === 'function') {
        handler.openIframe()
      } else {
        console.error('[v0] PaystackPop.openIframe is not available')
        throw new Error('Payment system error. Please try again.')
      }
    } catch (err) {
      console.error('[v0] Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setPaymentStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  if (paymentStatus === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Payment Successful!</h3>
        <p className="text-sm text-green-800 mb-4">Your enrollment is being processed. Redirecting...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Full Name *</label>
        <Input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Email Address *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          disabled={loading}
          className="w-full"
        />
      </div>

      <div className="rounded-lg bg-muted/50 p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Program</span>
          <span className="font-medium text-foreground">{programTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <div className="text-right">
            <p className="font-bold text-lg text-primary">USD ${amountInUSD}</p>
            <p className="text-xs text-muted-foreground">KES {amountInKES.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900">
          <strong>Accepted Methods:</strong> Card, M-Pesa, Airtel Money, Bank Transfer
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || !email.trim() || !fullName.trim() || !scriptReady}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2"
      >
        {!scriptReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Payment System...
          </>
        ) : loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay USD ${amountInUSD} with Paystack`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is processed securely by Paystack. No fees added.
      </p>
    </form>
  )
}
