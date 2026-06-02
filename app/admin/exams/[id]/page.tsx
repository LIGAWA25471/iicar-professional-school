'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, ArrowLeft, BarChart3, Users, TrendingUp, CheckCircle } from 'lucide-react'

interface Attempt {
  id: string
  respondent_name: string
  respondent_email: string
  score: number
  passed: boolean
  started_at: string
  completed_at: string
  time_taken_seconds: number
}

interface Stats {
  total_submissions: number
  average_score: number
  pass_count: number
  pass_rate: number
}

export default function ExamDetailsPage() {
  const params = useParams()
  const exam_id = params.id as string
  
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchAttempts = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/exams/attempts?exam_id=${exam_id}&limit=100`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch attempts')
      }

      const { attempts: attemptsData, stats: statsData } = await response.json()
      setAttempts(attemptsData)
      setStats(statsData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exam data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttempts()
    
    if (!autoRefresh) return
    
    const interval = setInterval(fetchAttempts, 5000)
    return () => clearInterval(interval)
  }, [exam_id, autoRefresh])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exam Monitoring</h1>
            <p className="text-sm text-muted-foreground">Track live submissions and responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Manual refresh'}
          </Button>
          <Button size="sm" onClick={fetchAttempts} disabled={loading}>
            Refresh now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total_submissions}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.average_score.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.pass_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.pass_rate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <Button size="sm" variant="link" onClick={fetchAttempts} className="mt-2">
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Submissions</h2>
            <p className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
        </div>

        {loading && attempts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>
        ) : attempts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No submissions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Score</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Time Taken</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{attempt.respondent_name}</td>
                    <td className="px-6 py-4 text-foreground text-xs">{attempt.respondent_email}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{attempt.score.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">{formatTime(attempt.time_taken_seconds)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{formatDate(attempt.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> This page auto-refreshes every 5 seconds. Click "Manual refresh" to turn off auto-refresh and refresh manually. If a student is having trouble submitting, ask them to check their internet connection and try again.
        </p>
      </div>
    </div>
  )
}
