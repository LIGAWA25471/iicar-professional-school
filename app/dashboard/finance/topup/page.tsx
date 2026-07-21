import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { WalletTopupForm } from '@/components/wallet-topup-form'

export const metadata = {
  title: 'Top Up Wallet | IICAR Global College',
  description: 'Add funds to your wallet using Paystack',
}

export default async function WalletTopupPage() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard/finance" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Top Up Your Wallet</h1>
          <p className="text-muted-foreground">Add funds to your account to enroll in paid courses</p>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-xl p-8">
          <WalletTopupForm userId={user.id} />
        </div>

        {/* Info */}
        <div className="mt-8 bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground mb-2">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Choose an amount and proceed to payment</li>
            <li>Complete payment via Paystack (credit/debit card, bank transfer)</li>
            <li>Your wallet is credited instantly</li>
            <li>Use your wallet balance to enroll in paid courses</li>
          </ul>
        </div>

        {/* Singapore Entity Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-900 mb-2">Singapore Operations</p>
          <p className="text-blue-800">
            Our Singapore courses are offered through <strong>GLOBAL BW COLLEGE PTE. LTD.</strong><br />
            UEN: 202327580E | SSIC: 85404<br />
            Address: 482 Pasir Ris Drive 4, #08-393, Singapore 510482
          </p>
        </div>
      </div>
    </div>
  )
}
