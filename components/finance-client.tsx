'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount_cents: number
  description: string
  reference_type: string
  created_at: string
}

interface FinanceClientProps {
  transactions: Transaction[]
}

export function FinanceClient({ transactions }: FinanceClientProps) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isCredit = transaction.type === 'credit'
        const amountKES = Math.round((transaction.amount_cents || 0) / 100)
        const amountUSD = Math.round((transaction.amount_cents || 0) / 13400)
        const date = new Date(transaction.created_at)
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        })

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`p-2 rounded-lg ${
                  isCredit ? 'bg-green-100/50' : 'bg-red-100/50'
                }`}
              >
                {isCredit ? (
                  <ArrowUpRight className={`h-4 w-4 ${isCredit ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <ArrowDownRight className={`h-4 w-4 ${isCredit ? 'text-green-600' : 'text-red-600'}`} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground capitalize">
                  {transaction.reference_type?.replace(/_/g, ' ') || transaction.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.description || formattedDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  isCredit ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isCredit ? '+' : '-'} KES {amountKES.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                USD ${amountUSD}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
