'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Clock, AlertCircle, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  payment_initiated: 'bg-blue-50 text-blue-900 border-blue-200',
  paid: 'bg-green-50 text-green-900 border-green-200',
  processing: 'bg-purple-50 text-purple-900 border-purple-200',
  completed: 'bg-green-50 text-green-900 border-green-200',
  failed: 'bg-red-50 text-red-900 border-red-200',
}

export default function AdminTranslationsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const response = await fetch('/api/admin/translations/list')
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('[v0] Error fetching translations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || req.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/translations/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setRequests(requests.map(r => 
          r.id === requestId ? { ...r, status: newStatus } : r
        ))
      }
    } catch (error) {
      console.error('[v0] Error updating status:', error)
    }
  }

  const handleSendEmail = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/translations/${requestId}/send-email`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Email sent successfully')
      }
    } catch (error) {
      console.error('[v0] Error sending email:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Translation Requests</h1>
        <p className="text-muted-foreground">Manage and process document translation requests</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
            <Input
              placeholder="Search by document name or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="payment_initiated">Payment Initiated</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchRequests} className="w-full">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No translation requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Document</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Languages</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Pages</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount (USD)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground truncate max-w-xs">{req.document_name}</p>
                          <p className="text-xs text-muted-foreground">{req.id.substring(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {req.languages_requested.map((lang: string) => (
                          <span key={lang} className="px-2 py-1 bg-muted rounded text-xs text-foreground">
                            {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{req.total_pages}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">${(req.total_cost_cents / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status as keyof typeof STATUS_COLORS]}`}>
                        {req.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {req.status === 'processing' && <Clock className="h-3 w-3" />}
                        {(req.status === 'pending' || req.status === 'payment_initiated') && <AlertCircle className="h-3 w-3" />}
                        {req.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                        >
                          <option value="pending">Pending</option>
                          <option value="payment_initiated">Payment Initiated</option>
                          <option value="paid">Paid</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(req.id)}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-foreground">{requests.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending Payment</p>
          <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending' || r.status === 'payment_initiated').length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold text-purple-600">{requests.filter(r => r.status === 'processing').length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'completed').length}</p>
        </div>
      </div>
    </div>
  )
}
