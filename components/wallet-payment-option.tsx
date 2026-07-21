'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface WalletPaymentOptionProps {
  programId: string
  programTitle: string
  amount: number
  onSuccess: () => void
  onBack: () => void
}

interface Wallet {
  balance_cents: number
}

export function WalletPaymentOption({
  programId,
  programTitle,
  amount,
  onSuccess,
  onBack,
}: WalletPaymentOptionProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWallet()
  }, [])

  async function fetchWallet() {
    try {
      const response = await fetch('/api/wallet/balance')
      const data = await response.json()
      if (response.ok) {
        setWallet(data.wallet)
      } else {
        setError('Failed to load wallet balance')
      }
    } catch (err) {
      console.error('[v0] Failed to fetch wallet:', err)
      setError('Failed to load wallet balance')
    } finally {
      setLoading(false)
    }
  }

  async function handleWalletEnroll() {
    if (!wallet || wallet.balance_cents < amount * 100) {
      setError('Insufficient balance')
      return
    }

    setEnrolling(true)
    setError('')

    try {
      const response = await fetch('/api/wallet/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          amount_cents: amount * 100,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Enrollment failed')
      }
    } catch (err) {
      console.error('[v0] Wallet enrollment error:', err)
      setError(err instanceof Error ? err.message : 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-center py-8">Loading wallet...</div>
      </div>
    )
  }

  const balanceKES = (wallet?.balance_cents || 0) / 100
  const balanceUSD = Math.round((wallet?.balance_cents || 0) / 13400)
  const amountKES = amount
  const amountUSD = Math.round(amount / 134)
  const hasInsufficientBalance = (wallet?.balance_cents || 0) < amount * 100

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Course Summary */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-1">Course</p>
        <p className="font-semibold text-foreground mb-4">{programTitle}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount Due:</span>
          <span className="font-bold text-lg">
            USD ${amountUSD}
            <span className="text-sm text-muted-foreground ml-2">({amountKES.toLocaleString()} KES)</span>
          </span>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className={`border-2 rounded-lg p-4 ${hasInsufficientBalance ? 'border-destructive/20 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
        <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
        <p className={`font-bold text-2xl ${hasInsufficientBalance ? 'text-destructive' : 'text-primary'}`}>
          USD ${balanceUSD}
          <span className="text-sm text-muted-foreground ml-2">({balanceKES.toLocaleString()} KES)</span>
        </p>
      </div>

      {/* Error or Warning */}
      {hasInsufficientBalance && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-semibold mb-1">Insufficient Balance</p>
            <p>You need at least USD ${amountUSD} to enroll in this course.</p>
            <Button asChild variant="outline" className="mt-2 h-8 text-xs">
              <Link href="/dashboard/finance/topup">Top Up Wallet</Link>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleWalletEnroll}
          disabled={hasInsufficientBalance || enrolling}
          className="w-full"
          size="lg"
        >
          {enrolling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enrolling...
            </>
          ) : (
            `Enroll with Wallet - USD $${amountUSD}`
          )}
        </Button>

        {hasInsufficientBalance && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/finance/topup">Add Funds to Wallet</Link>
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your wallet balance will be debited upon successful enrollment.
      </p>
    </div>
  )
}
