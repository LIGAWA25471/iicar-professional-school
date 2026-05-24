'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, BookOpen } from 'lucide-react'
import ExamQuestion from '@/components/exam-question'
import ExamResults from '@/components/exam-results'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: Record<string, string> | null
  difficulty: string
}

interface Exam {
  id: string
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  subject: string
  difficulty_level: string
}

interface ExamTakerProps {
  exam: Exam
  questions: Question[]
  token: string
}

export default function ExamTaker({ exam, questions, token }: ExamTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(exam.duration_minutes * 60)
  const [submitted, setSubmitted] = useState(false)
  const [respondentInfo, setRespondentInfo] = useState({ name: '', email: '' })
  const [showForm, setShowForm] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer effect
  useEffect(() => {
    if (!startTime || submitted) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time's up
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, submitted])

  const handleStartExam = () => {
    if (!respondentInfo.name || !respondentInfo.email) {
      setError('Please fill in your name and email')
      return
    }
    setShowForm(false)
    setStartTime(new Date())
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      setError('Please answer at least one question')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: exam.id,
          token,
          respondent_name: respondentInfo.name,
          respondent_email: respondentInfo.email,
          answers,
          time_taken_seconds: startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit exam')
      }

      const result = await response.json()
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  if (submitted) {
    return <ExamResults exam={exam} answers={answers} questions={questions} respondentName={respondentInfo.name} />
  }

  if (showForm) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-lg border border-border bg-card p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{exam.description}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{questions.length} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{exam.duration_minutes} Minutes</span>
            </div>
            <div>
              <Badge className="capitalize">{exam.difficulty_level}</Badge>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Full Name *</label>
              <input
                type="text"
                value={respondentInfo.name}
                onChange={(e) => setRespondentInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email *</label>
              <input
                type="email"
                value={respondentInfo.email}
                onChange={(e) => setRespondentInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background text-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <Button
            onClick={handleStartExam}
            className="w-full"
            disabled={!respondentInfo.name || !respondentInfo.email}
          >
            Start Exam
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By starting, you agree to complete the exam honestly
          </p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-card border border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground">{exam.title}</h2>
              <p className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-muted-foreground">Time remaining</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {answeredCount} of {questions.length} answered
          </p>
        </div>

        {/* Question */}
        <div className="rounded-lg border border-border bg-card p-6">
          <ExamQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] || ''}
            onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || answeredCount === 0}
              className="px-8"
            >
              {loading ? 'Submitting...' : 'Submit Exam'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
