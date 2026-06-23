import { createAdminClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay, endOfDay, subMonths } from 'date-fns'
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PaymentsClient } from '@/components/payments-client'

export const metadata = {
  title: 'Payments & Analytics | Admin Dashboard',
  description: 'View all payments, transactions, and income analytics'
}

export const dynamic = 'force-dynamic'

interface PaymentStats {
  total: number
  paid: number
  pending: number
  failed: number
  totalAmountPaid: number
  totalAmountPending: number
  allTimeIncome: number
  monthIncome: number
  weekIncome: number
  lastMonthIncome: number
  lastWeekIncome: number
}

async function getPaymentStats(): Promise<PaymentStats> {
  const adminDb = createAdminClient()
  
  const now = new Date()
  const weekAgo = subDays(now, 7)
  const monthAgo = subDays(now, 30)
  const twoMonthsAgo = subMonths(now, 1)
  const eightDaysAgo = subDays(now, 8)

  // Get all payments
  const { data: allPayments } = await adminDb
    .from('payments')
    .select('id, status, amount_cents, paid_at, created_at')

  // Get payments from last week
  const { data: weekPayments } = await adminDb
    .from('payments')
    .select('id, status, amount_cents, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', weekAgo.toISOString())

  // Get payments from last month
  const { data: monthPayments } = await adminDb
    .from('payments')
    .select('id, status, amount_cents, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', monthAgo.toISOString())

  // Get payments from previous month (for comparison)
  const { data: prevMonthPayments } = await adminDb
    .from('payments')
    .select('id, status, amount_cents, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', twoMonthsAgo.toISOString())
    .lt('paid_at', monthAgo.toISOString())

  // Get payments from previous week (for comparison)
  const { data: prevWeekPayments } = await adminDb
    .from('payments')
    .select('id, status, amount_cents, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', eightDaysAgo.toISOString())
    .lt('paid_at', weekAgo.toISOString())

  const payments = allPayments || []
  
  const stats: PaymentStats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmountPaid: payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    totalAmountPending: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    allTimeIncome: payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    monthIncome: (monthPayments || [])
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    weekIncome: (weekPayments || [])
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    lastMonthIncome: (prevMonthPayments || [])
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
    lastWeekIncome: (prevWeekPayments || [])
      .reduce((sum, p) => sum + p.amount_cents, 0) / 100,
  }

  return stats
}

export default async function PaymentsPage() {
  const stats = await getPaymentStats()

  // Calculate month-over-month and week-over-week growth
  const monthGrowth = stats.lastMonthIncome > 0 
    ? ((stats.monthIncome - stats.lastMonthIncome) / stats.lastMonthIncome * 100).toFixed(1)
    : 0
  const weekGrowth = stats.lastWeekIncome > 0
    ? ((stats.weekIncome - stats.lastWeekIncome) / stats.lastWeekIncome * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments & Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor all transactions and revenue metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Income (All Time)</p>
              <p className="mt-2 text-2xl font-bold text-primary">KES {stats.allTimeIncome.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">USD {Math.round(stats.allTimeIncome / 134).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* This Month Income */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</p>
              <p className="mt-2 text-2xl font-bold text-foreground">KES {stats.monthIncome.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1">
                {monthGrowth !== '0' && (
                  <>
                    <TrendingUp className={`h-3 w-3 ${Number(monthGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${Number(monthGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthGrowth}% vs last month
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* This Week Income */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Week</p>
              <p className="mt-2 text-2xl font-bold text-foreground">KES {stats.weekIncome.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1">
                {weekGrowth !== '0' && (
                  <>
                    <TrendingUp className={`h-3 w-3 ${Number(weekGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${Number(weekGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {weekGrowth}% vs last week
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Payment Status Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed
                </span>
                <span className="font-semibold">{stats.paid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pending
                </span>
                <span className="font-semibold">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Failed
                </span>
                <span className="font-semibold">{stats.failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">All Transactions</h2>
          <p className="mt-1 text-xs text-muted-foreground">Complete payment history and transaction details</p>
        </div>
        <PaymentsClient />
      </div>
    </div>
  )
}
