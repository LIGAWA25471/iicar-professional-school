import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, ArrowDownRight, ArrowUpRight, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FinanceClient } from '@/components/finance-client'

export const metadata = {
  title: 'Finance | IICAR Global College',
  description: 'Manage your wallet and payment plans',
}

async function getStudentFinanceData(userId: string) {
  const adminDb = createAdminClient()

  // Get wallet
  const { data: wallet } = await adminDb
    .from('student_wallets')
    .select('*')
    .eq('student_id', userId)
    .single()

  // Get transactions
  const { data: transactions } = await adminDb
    .from('wallet_transactions')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get enrollments with payment plans
  const { data: paymentPlans } = await adminDb
    .from('student_payment_plans')
    .select(
      `
      *,
      enrollment:enrollments(id, program_id, status),
      program:programs(id, title, price_cents)
      `
    )
    .eq('student_id', userId)

  return {
    wallet: wallet || { balance_cents: 0, total_credited_cents: 0, total_spent_cents: 0 },
    transactions: transactions || [],
    paymentPlans: paymentPlans || [],
  }
}

export default async function FinancePage() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const data = await getStudentFinanceData(user.id)

  const balanceUSD = Math.round(data.wallet.balance_cents / 13400)
  const balanceKES = Math.round(data.wallet.balance_cents / 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Finance</h1>
          <p className="text-muted-foreground">Manage your wallet and payment plans</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-bold text-primary">USD ${balanceUSD}</h2>
                <span className="text-lg text-muted-foreground">KES {balanceKES.toLocaleString()}</span>
              </div>
            </div>
            <CreditCard className="h-16 w-16 text-primary/20" />
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/finance/topup">
                <Plus className="h-4 w-4 mr-2" />
                Top Up Wallet
              </Link>
            </Button>
            <Button variant="outline">
              <ArrowDownRight className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </div>

        {/* Singapore Entity Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Singapore Operations</h3>
            <p className="text-sm text-blue-800">
              Our Singapore courses are offered through <strong>GLOBAL BW COLLEGE PTE. LTD.</strong><br />
              UEN: 202327580E | Industry: Commercial schools offering tertiary education programmes<br />
              Address: 482 Pasir Ris Drive 4, #08-393, Singapore 510482
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Recent Transactions</h3>
              {data.transactions.length > 0 ? (
                <FinanceClient transactions={data.transactions} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Plans */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Active Payment Plans</h3>
            {data.paymentPlans.length > 0 ? (
              <div className="space-y-4">
                {data.paymentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <p className="font-medium text-foreground text-sm mb-2">
                      {(plan as any).program?.title || 'Course'}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Status: <span className="font-semibold text-primary">{plan.status}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid: KES {Math.round((plan.amount_paid_cents || 0) / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: KES {Math.round((plan.total_amount_cents || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active payment plans
              </p>
            )}
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Enrolled Courses</h3>
          <p className="text-muted-foreground text-center py-8">
            View your enrolled courses in <Link href="/dashboard/programs" className="text-primary hover:underline">My Programs</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
