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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'verifying'>('idle')
  const [scriptReady, setScriptReady] = useState(false)
  const [verificationTimeout, setVerificationTimeout] = useState(false)
  const [paystackHandler, setPaystackHandler] = useState<any>(null)

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
          console.log('[v0] Paystack modal closed by user')
          // Only reset if we're not already verifying
          if (paymentStatus !== 'verifying') {
            setPaymentStatus('idle')
            setLoading(false)
          }
        },
        onSuccess: async function (transaction: any) {
          console.log('[v0] Paystack transaction successful, verifying payment:', transaction)
          setPaymentStatus('verifying')
          setLoading(true)
          
          // Set a 15-second timeout for verification
          const timeoutId = setTimeout(() => {
            console.warn('[v0] Payment verification timeout after 15 seconds')
            setVerificationTimeout(true)
            setPaymentStatus('processing')
          }, 15000)
          
          try {
            // Verify payment with backend to ensure it was actually successful
            const verifyResponse = await fetch('/api/payments/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: data.reference,
              }),
            })

            clearTimeout(timeoutId)
            const verifyData = await verifyResponse.json()
            console.log('[v0] Payment verification result:', verifyData)

            if (verifyData.status === 'success') {
              console.log('[v0] Payment verified successfully')
              setVerificationTimeout(false)
              setPaymentStatus('success')
              if (onSuccess) onSuccess()
              setTimeout(() => {
                router.push(`/dashboard/programs/${programId}`)
                router.refresh()
              }, 2000)
            } else {
              clearTimeout(timeoutId)
              console.error('[v0] Payment verification failed:', verifyData.message)
              setError(verifyData.message || 'Payment verification failed. Please contact support.')
              setPaymentStatus('processing')
            }
          } catch (err) {
            clearTimeout(timeoutId)
            console.error('[v0] Verification error:', err)
            setError('Could not verify payment. Please contact support if you were charged.')
            setPaymentStatus('processing')
          }
        },
      })
      
      // Store handler for potential manual retry
      setPaystackHandler(handler)
      
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
        <p className="text-sm text-green-800 mb-4">Your enrollment is being processed. Redirecting to your program...</p>
      </div>
    )
  }

  if (paymentStatus === 'verifying') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
        <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Verifying Payment</h3>
        <p className="text-sm text-blue-800 mb-4">Please wait while we confirm your payment status...</p>
      </div>
    )
  }

  // Show timeout message with manual continue button
  if (verificationTimeout && paymentStatus === 'processing') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Verifying Your Payment</h3>
              <p className="text-sm text-yellow-800 mb-4">
                Your payment appears to be processing. If you've completed payment on Paystack, click the button below to verify and continue.
              </p>
              <Button
                onClick={() => {
                  setVerificationTimeout(false)
                  router.push(`/dashboard/programs/${programId}`)
                  router.refresh()
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Continue to Program
              </Button>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If you weren't charged, you can safely{' '}
            <button
              onClick={() => {
                setPaymentStatus('idle')
                setVerificationTimeout(false)
                setError('')
              }}
              className="underline text-primary hover:text-primary/80"
            >
              try again
            </button>
          </p>
        </div>
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
