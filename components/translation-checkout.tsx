'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LANGUAGES = {
  fr: 'French',
  pt: 'Portuguese',
  ar: 'Arabic',
  es: 'Spanish',
  en: 'English',
  ur: 'Urdu',
  ru: 'Russian',
  bn: 'Bengali',
  hi: 'Hindi',
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

interface TranslationCheckoutProps {
  translation: any
}

export function TranslationCheckout({ translation }: TranslationCheckoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationTimeout, setVerificationTimeout] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success'>('idle')

  const amountInUSD = translation.total_cost_cents / 100
  const amountInKES = Math.round(amountInUSD * 134 * 100) // 1 USD = 134 KES

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('[v0] Initiating translation payment:', { translationId: translation.id, amountInKES })

      const response = await fetch('/api/translations/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_id: translation.id,
          amount_cents: amountInKES,
        }),
      })

      const data = await response.json()
      console.log('[v0] Payment initialization response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed')
      }

      // Open Paystack modal
      if (window.PaystackPop) {
        window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
          email: data.email,
          amount: amountInKES,
          currency: 'KES',
          ref: data.reference,
          onClose: function () {
            console.log('[v0] Paystack modal closed by user')
            if (verificationStatus !== 'verifying') {
              setLoading(false)
            }
          },
          onSuccess: async function (transaction: any) {
            console.log('[v0] Paystack payment closed, verifying:', transaction)
            setVerificationStatus('verifying')
            setLoading(true)

            // Set a 15-second timeout for verification
            const timeoutId = setTimeout(() => {
              console.warn('[v0] Payment verification timeout after 15 seconds')
              setVerificationTimeout(true)
              setVerificationStatus('idle')
            }, 15000)

            try {
              const verifyResponse = await fetch('/api/translations/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reference: data.reference,
                  translation_id: translation.id,
                }),
              })

              clearTimeout(timeoutId)
              const verifyData = await verifyResponse.json()
              console.log('[v0] Verification result:', verifyData)

              if (verifyData.status === 'success') {
                console.log('[v0] Payment verified, redirecting to receipt')
                setVerificationStatus('success')
                setVerificationTimeout(false)
                setTimeout(() => {
                  router.push(`/dashboard/translations/${translation.id}/receipt`)
                  router.refresh()
                }, 2000)
              } else {
                clearTimeout(timeoutId)
                throw new Error(verifyData.message || 'Payment verification failed')
              }
            } catch (verifyError) {
              clearTimeout(timeoutId)
              console.error('[v0] Verification error:', verifyError)
              setError('Payment verification failed. Please contact support if you were charged.')
              setVerificationStatus('idle')
              setLoading(false)
            }
          },
        })
        window.PaystackPop.openIframe()
      } else {
        throw new Error('Paystack not loaded')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMsg)
      console.error('[v0] Payment error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Order Summary */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

        <div className="border-b border-border pb-4">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{translation.document_name}</p>
              <p className="text-sm text-muted-foreground">{translation.total_pages} page{translation.total_pages !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-foreground">Languages:</p>
          <div className="space-y-1">
            {translation.languages_requested.map((lang: string) => (
              <p key={lang} className="text-sm text-muted-foreground">
                • {LANGUAGES[lang as keyof typeof LANGUAGES] || lang}
              </p>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pages:</span>
            <span className="text-foreground font-medium">{translation.total_pages}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Languages:</span>
            <span className="text-foreground font-medium">{translation.languages_requested.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price per page:</span>
            <span className="text-foreground font-medium">$25</span>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Amount (USD)</p>
          <p className="text-2xl font-bold text-foreground">${amountInUSD.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">≈ {(amountInUSD * 134).toLocaleString()} KES</p>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Payment Details</h2>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Translation ID:</p>
            <p className="font-mono text-foreground break-all">{translation.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Status:</p>
            <p className="text-foreground capitalize">{translation.status}</p>
          </div>
        </div>

        {verificationStatus === 'verifying' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium text-blue-900">Verifying Payment</p>
            <p className="text-xs text-blue-800">Please wait while we confirm your payment...</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-green-900">Payment Successful!</p>
            <p className="text-xs text-green-800 mt-1">Preparing your receipt...</p>
          </div>
        )}

        {verificationTimeout && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Verifying Your Payment</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Your payment appears to be processing. Click the button below to verify and continue.
                </p>
                <Button
                  onClick={() => {
                    setVerificationTimeout(false)
                    router.push(`/dashboard/translations/${translation.id}/receipt`)
                    router.refresh()
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                >
                  Continue to Receipt
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-2">Processing Time</p>
          <p>Your translated documents will be ready within 24-72 hours after payment is confirmed.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              {error}
              <button
                onClick={() => {
                  setError('')
                  setVerificationStatus('idle')
                }}
                className="block text-xs underline mt-2 hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!verificationTimeout && verificationStatus !== 'verifying' && verificationStatus !== 'success' && (
          <Button
            onClick={handlePayment}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amountInUSD.toFixed(2)} with Paystack`
            )}
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Secure payment via Paystack</p>
          <p>• Receipt sent via email immediately</p>
          <p>• Your card details are never stored</p>
        </div>
      </div>
    </div>
  )
            </>
          ) : (
            `Pay $${amountInUSD.toFixed(2)} with Paystack`
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Secure payment via Paystack</p>
          <p>• Receipt sent via email immediately</p>
          <p>• Your card details are never stored</p>
        </div>
      </div>
    </div>
  )
}
