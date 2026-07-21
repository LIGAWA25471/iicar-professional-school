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
  { usd: 10, kes: 1340 },
  { usd: 25, kes: 3350 },
  { usd: 50, kes: 6700 },
  { usd: 100, kes: 13400 },
  { usd: 250, kes: 33500 },
  { usd: 500, kes: 67000 },
]

export function WalletTopupForm({ userId }: WalletTopupFormProps) {
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amount = selectedAmount !== null ? selectedAmount : (customAmount ? parseInt(customAmount) * 100 : 0)
  const amountKES = amount / 100
  const amountUSD = Math.round(amount / 13400)

  async function handleTopup() {
    if (!amount || amount < 100) {
      setError('Minimum amount is KES 100')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/wallet/topup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amount,
          user_id: userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to initialize payment')
        setLoading(false)
        return
      }

      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else if (window.PaystackPop) {
        window.PaystackPop.setup({
          key: data.publicKey,
          email: data.email,
          amount: amount,
          currency: 'KES',
          ref: data.reference,
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
                setSelectedAmount(preset.kes * 100)
                setCustomAmount('')
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedAmount === preset.kes * 100
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              <div className="font-semibold">${preset.usd}</div>
              <div className="text-xs opacity-70">{preset.kes.toLocaleString()} KES</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Or Enter Custom Amount (KES)</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter amount in KES"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setSelectedAmount(null)
            }}
            min="100"
            step="100"
            className="flex-1"
          />
        </div>
      </div>

      {/* Amount Summary */}
      {amount > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount (KES):</span>
            <span className="font-semibold text-foreground">{amountKES.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Equivalent (USD):</span>
            <span className="font-semibold text-foreground">${amountUSD}</span>
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
        disabled={loading || amount < 100}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Proceed to Payment - KES ${amountKES.toLocaleString()}`
        )}
      </Button>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Payment processed by Paystack</p>
        <p>• Your wallet is credited immediately upon successful payment</p>
        <p>• Minimum top-up: KES 100</p>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    PaystackPop?: any
  }
}
