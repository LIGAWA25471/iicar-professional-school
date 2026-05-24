'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ExamCreateForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'intermediate',
    total_questions: 50,
    duration_minutes: 60,
    passing_score: 70,
    scheduled_date: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_questions' || name === 'duration_minutes' || name === 'passing_score' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create exam')
      }

      const { exam } = await response.json()
      setShareToken(exam.share_token)
      setSuccess(true)
      
      // Redirect to exams list after 3 seconds
      setTimeout(() => {
        router.push('/admin/exams')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success && shareToken) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Exam Created Successfully!</h3>
            <p className="mt-2 text-sm text-muted-foreground mb-4">
              Your exam has been created with AI-generated questions. Share this link with test takers:
            </p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <code className="text-xs break-all text-foreground">
                {typeof window !== 'undefined' ? `${window.location.origin}/exam/${shareToken}` : 'Loading...'}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecting to exams list in a few seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Exam Title *</label>
          <Input
            name="title"
            placeholder="e.g., AWS Solutions Architect Certification"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">The name of the exam</p>
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Subject *</label>
          <Input
            name="subject"
            placeholder="e.g., Cloud Computing, Software Engineering, Data Science"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">The main topic for question generation</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Description</label>
          <Textarea
            name="description"
            placeholder="Provide context or specific areas to focus on..."
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: Help AI understand the scope</p>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Difficulty Level *</label>
          <select
            name="difficulty_level"
            value={formData.difficulty_level}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Total Questions */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Total Questions: <Badge className="ml-2">{formData.total_questions}</Badge>
          </label>
          <input
            type="range"
            name="total_questions"
            min="50"
            max="100"
            value={formData.total_questions}
            onChange={handleChange}
            disabled={loading}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">Between 50 and 100 questions (AI will generate)</p>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Duration (minutes) *</label>
            <Input
              type="number"
              name="duration_minutes"
              min="15"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Passing Score (%) *</label>
            <Input
              type="number"
              name="passing_score"
              min="0"
              max="100"
              value={formData.passing_score}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Schedule Date (Optional)</label>
          <Input
            type="datetime-local"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleChange}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty to make exam available immediately</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || !formData.title || !formData.subject}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Questions...
            </>
          ) : (
            'Create Exam with AI Questions'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
