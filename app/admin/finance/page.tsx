'use client'

import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Plus, Minus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Student {
  id: string
  full_name: string
  email: string
}

interface Wallet {
  student_id: string
  balance_cents: number
  total_credited_cents: number
  total_spent_cents: number
}

export default function AdminFinancePage() {
  const [students, setStudents] = useState<(Student & { wallet: Wallet })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'credit' | 'debit'>('credit')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    try {
      const response = await fetch('/api/admin/wallet/students')
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('[v0] Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTransaction() {
    if (!selectedStudent || !amount || !reason) {
      alert('Please fill in all fields')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent,
          amount_cents: Math.round(parseFloat(amount) * 100),
          transaction_type: action,
          reason,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Successfully ${action}ed KES ${amount}`)
        setAmount('')
        setReason('')
        setSelectedStudent(null)
        await fetchStudents()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('[v0] Transaction error:', error)
      alert('Failed to process transaction')
    } finally {
      setProcessing(false)
    }
  }

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Loading students...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Student Finance Management</h1>
        <CreditCard className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold text-foreground">{students.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Wallet Balance</p>
          <p className="text-2xl font-bold text-foreground">
            ${Math.round(students.reduce((sum, s) => sum + (s.wallet?.balance_cents || 0), 0) / 13400)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Credited</p>
          <p className="text-2xl font-bold text-primary">
            ${Math.round(students.reduce((sum, s) => sum + (s.wallet?.total_credited_cents || 0), 0) / 13400)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Add Credit/Debit</h2>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Student</label>
            <Input
              placeholder="Search student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded p-2 space-y-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student.id)
                      setSearchTerm('')
                    }}
                    className="w-full text-left p-2 hover:bg-muted rounded text-sm"
                  >
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Action</label>
                <div className="flex gap-2">
                  <Button
                    variant={action === 'credit' ? 'default' : 'outline'}
                    onClick={() => setAction('credit')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Credit
                  </Button>
                  <Button
                    variant={action === 'debit' ? 'default' : 'outline'}
                    onClick={() => setAction('debit')}
                    className="flex-1"
                  >
                    <Minus className="h-4 w-4 mr-2" /> Debit
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Reason</label>
                <Input
                  placeholder="e.g., Manual adjustment, Payment received"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                onClick={handleTransaction}
                disabled={processing}
                className="w-full"
              >
                {processing ? 'Processing...' : `${action === 'credit' ? 'Credit' : 'Debit'} Account`}
              </Button>
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">Student Accounts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Balance</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total Credited</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-foreground">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">
                    <p className="font-semibold text-foreground">
                      ${Math.round((student.wallet?.balance_cents || 0) / 13400)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((student.wallet?.balance_cents || 0) / 100).toFixed(0)} KES
                    </p>
                  </td>
                  <td className="text-right py-3 px-2 text-primary">
                    ${Math.round((student.wallet?.total_credited_cents || 0) / 13400)}
                  </td>
                  <td className="text-right py-3 px-2 text-destructive">
                    ${Math.round((student.wallet?.total_spent_cents || 0) / 13400)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
