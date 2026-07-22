'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface WalletTopupFormProps {
  userId: string
}

const PRESET_AMOUNTS = [
  { usd: 10 },
  { usd: 25 },
  { usd: 50 },
  { usd: 100 },
  { usd: 250 },
  { usd: 500 },
]

const USD_TO_KES = 134 // 1 USD = 134 KES

export function WalletTopupForm({ userId }: WalletTopupFormProps) {
  const router = useRouter()
  const [selectedAmountUSD, setSelectedAmountUSD] = useState<number | null>(null)
  const [customAmountUSD, setCustomAmountUSD] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get USD amount (from preset or custom input)
  const amountUSD = selectedAmountUSD !== null ? selectedAmountUSD : (customAmountUSD ? parseFloat(customAmountUSD) : 0)
  
  // Convert USD to KES (in cents) for API
  const amountKESCents = Math.round(amountUSD * USD_TO_KES * 100)

  async function handleTopup() {
    if (!amountUSD || amountUSD < 1) {
      setError('Minimum amount is USD 1')
      return
    }

    if (amountUSD > 10000) {
      setError('Maximum amount is USD 10,000')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('[v0] Initiating wallet topup: USD', amountUSD, '-> KES cents:', amountKESCents)
      
      const response = await fetch('/api/wallet/topup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountKESCents,
          user_id: userId,
        }),
      })

      const data = await response.json()
      console.log('[v0] API Response:', data)

      if (!response.ok) {
        setError(data.error || 'Failed to initialize payment')
        setLoading(false)
        return
      }

      // Redirect to Paystack checkout
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      } else if (window.PaystackPop) {
        window.PaystackPop.setup({
          key: data.data?.publicKey,
          email: data.data?.email,
          amount: amountKESCents,
          currency: 'KES',
          ref: data.data?.reference,
          onClose: function() {
            setLoading(false)
          },
          onSuccess: function(transaction: any) {
            router.push('/dashboard/finance')
            router.refresh()
          },
        })
        window.PaystackPop.openIframe()
      }
    } catch (err) {
      console.error('[v0] Top-up error:', err)
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preset Amounts */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Quick Select</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.usd}
              onClick={() => {
                setSelectedAmountUSD(preset.usd)
                setCustomAmountUSD('')
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedAmountUSD === preset.usd
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              <div className="font-semibold">${preset.usd}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Or Enter Custom Amount (USD)</label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 bg-muted border border-border rounded-lg text-muted-foreground font-medium">$</span>
          <Input
            type="number"
            placeholder="Enter amount in USD"
            value={customAmountUSD}
            onChange={(e) => {
              setCustomAmountUSD(e.target.value)
              setSelectedAmountUSD(null)
            }}
            min="1"
            max="10000"
            step="0.01"
            className="flex-1"
          />
        </div>
      </div>

      {/* Amount Summary */}
      {amountUSD > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount (USD):</span>
            <span className="font-semibold text-foreground">${amountUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">In KES (approx):</span>
            <span className="text-xs text-muted-foreground">≈ {(amountUSD * USD_TO_KES).toLocaleString(undefined, { maximumFractionDigits: 0 })} KES</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleTopup}
        disabled={loading || amountUSD < 1}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Proceed to Payment - $${amountUSD.toFixed(2)}`
        )}
      </Button>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Amounts shown in USD, converted to KES for payment</p>
        <p>• Payment processed by Paystack (KES)</p>
        <p>• Your wallet is credited immediately upon successful payment</p>
        <p>• Minimum top-up: USD 1</p>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    PaystackPop?: any
  }
}
