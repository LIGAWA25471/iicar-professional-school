'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Eye, BarChart3, Trash2 } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  difficulty_level: string
  total_questions: number
  status: string
  scheduled_date: string | null
  created_at: string
  share_token: string
}

interface ExamsTableProps {
  exams: Exam[]
}

export default function ExamsTable({ exams }: ExamsTableProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopyLink = (token: string) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/exam/${token}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-50 text-green-700'
      case 'intermediate': return 'bg-yellow-50 text-yellow-700'
      case 'advanced': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  if (exams.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="text-muted-foreground mb-4">
          <BarChart3 className="h-12 w-12 mx-auto opacity-50 mb-4" />
          <p className="text-sm">No exams created yet</p>
        </div>
        <Button asChild>
          <Link href="/admin/exams/create">Create Your First Exam</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-foreground">Title</th>
              <th className="px-6 py-4 text-left font-medium text-foreground">Subject</th>
              <th className="px-6 py-4 text-left font-medium text-foreground">Questions</th>
              <th className="px-6 py-4 text-left font-medium text-foreground">Difficulty</th>
              <th className="px-6 py-4 text-left font-medium text-foreground">Status</th>
              <th className="px-6 py-4 text-left font-medium text-foreground">Share Link</th>
              <th className="px-6 py-4 text-right font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{exam.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-foreground">{exam.subject}</td>
                <td className="px-6 py-4 text-foreground">{exam.total_questions}</td>
                <td className="px-6 py-4">
                  <Badge className={`capitalize ${getDifficultyColor(exam.difficulty_level)}`}>
                    {exam.difficulty_level}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge className={`capitalize ${getStatusColor(exam.status)}`}>
                    {exam.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded text-foreground truncate max-w-xs">
                      {exam.share_token.slice(0, 8)}...
                    </code>
                    <button
                      onClick={() => handleCopyLink(exam.share_token)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy share link"
                    >
                      {copied === exam.share_token ? (
                        <span className="text-xs text-green-600">Copied</span>
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    title="View live monitoring and responses"
                  >
                    <Link href={`/admin/exams/${exam.id}`}>
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    title="Preview exam"
                  >
                    <Link href={`/exam/${exam.share_token}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
