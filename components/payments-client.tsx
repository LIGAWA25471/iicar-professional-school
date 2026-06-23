'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronDown, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Payment {
  id: string
  student_id: string
  program_id: string
  amount_cents: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  created_at: string
  paid_at: string | null
  phone_number?: string
  kopokopo_reference?: string
  paystack_reference?: string
}

export function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/admin/payments')
        const data = await response.json()
        setPayments(data.payments || [])
      } catch (error) {
        console.error('[v0] Failed to fetch payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const filteredPayments = useMemo(() => {
    let result = payments

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus)
    }

    // Filter by search term (amount or reference)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.amount_cents.toString().includes(term) ||
        p.kopokopo_reference?.toLowerCase().includes(term) ||
        p.paystack_reference?.toLowerCase().includes(term) ||
        p.phone_number?.includes(term)
      )
    }

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      result.sort((a, b) => b.amount_cents - a.amount_cents)
    }

    return result
  }, [payments, searchTerm, filterStatus, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="border-b border-border px-6 py-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by amount, reference, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Newest First</option>
              <option value="amount">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          Showing {filteredPayments.length} of {payments.length} transactions
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Reference</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">
                    KES {(payment.amount_cents / 100).toLocaleString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      USD {Math.round(payment.amount_cents / 100 / 134).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                    {payment.paystack_reference || payment.kopokopo_reference || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {payment.phone_number || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        payment.status === 'paid'
                          ? 'bg-green-500/10 text-green-700 border-green-200'
                          : payment.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
                          : 'bg-red-500/10 text-red-700 border-red-200'
                      }
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {payment.paid_at ? format(new Date(payment.paid_at), 'MMM dd, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
