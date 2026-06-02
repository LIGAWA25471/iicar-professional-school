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
  const [submissionAttempt, setSubmissionAttempt] = useState(0)
  const [savedEmails, setSavedEmails] = useState<string[]>([])

  // Load saved progress when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved emails
      const saved = localStorage.getItem('exam_emails_history')
      if (saved) {
        try {
          setSavedEmails(JSON.parse(saved))
        } catch (err) {
          console.log('[v0] Could not load email history')
        }
      }

      // Load saved exam progress
      const savedExam = localStorage.getItem(`exam_progress_${exam.id}`)
      if (savedExam) {
        try {
          const { answers: savedAnswers, email, name } = JSON.parse(savedExam)
          setAnswers(savedAnswers)
          setRespondentInfo({ email, name })
          setShowForm(false)
          setStartTime(new Date())
        } catch (err) {
          console.log('[v0] Could not restore saved exam progress')
        }
      }
    }
  }, [exam.id])

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
    // Save respondent info and email history
    if (typeof window !== 'undefined') {
      const examProgress = { answers, email: respondentInfo.email, name: respondentInfo.name }
      localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify(examProgress))
      
      // Save email to history (keep last 5 unique emails)
      const uniqueEmails = [respondentInfo.email, ...savedEmails.filter(e => e !== respondentInfo.email)].slice(0, 5)
      localStorage.setItem('exam_emails_history', JSON.stringify(uniqueEmails))
    }
  }

  const handleEmailSelect = (email: string) => {
    setRespondentInfo(prev => ({ ...prev, email }))
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: answer
    }
    setAnswers(updatedAnswers)
    // Autosave to localStorage
    if (typeof window !== 'undefined') {
      const examProgress = { 
        answers: updatedAnswers, 
        email: respondentInfo.email, 
        name: respondentInfo.name,
        timestamp: Date.now() 
      }
      localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify(examProgress))
    }
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
    const answeredQuestions = Object.keys(answers).length
    if (answeredQuestions === 0) {
      setError('Please answer at least one question before submitting')
      return
    }

    setLoading(true)
    setError(null)

    // Check internet connectivity
    if (!navigator.onLine) {
      setError('No internet connection. Please check your network and try again.')
      setLoading(false)
      return
    }

    const timeTakenSeconds = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0
    
    // Retry logic
    let lastError: string | null = null
    let finalAttempt = 0

    for (let attempt = 1; attempt <= 3; attempt++) {
      finalAttempt = attempt
      try {
        console.log(`[v0] Submitting exam attempt ${attempt}/3`)
        const response = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: exam.id,
            token,
            respondent_name: respondentInfo.name.trim(),
            respondent_email: respondentInfo.email.trim(),
            answers,
            time_taken_seconds: timeTakenSeconds,
          }),
        })

        const data = await response.json()
        console.log(`[v0] Submission response status: ${response.status}`)

        if (!response.ok) {
          lastError = data.error || `Server error: ${response.status}`
          console.error(`[v0] Submission attempt ${attempt} failed:`, lastError)
          
          if (attempt < 3 && response.status >= 500) {
            // Retry on server errors
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          throw new Error(lastError)
        }

        console.log('[v0] Submission successful')
        // Clear saved progress on successful submission
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`exam_progress_${exam.id}`)
        }
        setSubmitted(true)
        return
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Failed to submit exam'
        console.error(`[v0] Submission attempt ${attempt} error:`, lastError)
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // Submission failed after all retries
    const errorMessage = getErrorMessage(lastError, finalAttempt)
    setError(errorMessage)
    setSubmissionAttempt(finalAttempt)
    setLoading(false)
  }

  const getErrorMessage = (error: string | null, attempt: number): string => {
    if (!error) return 'Failed to submit exam after multiple attempts.'
    
    if (error.includes('No internet')) {
      return 'No internet connection detected. Please check your WiFi or mobile data and try again.'
    }
    if (error.includes('Exam not found')) {
      return 'The exam link is invalid or expired. Contact your instructor for a new link.'
    }
    if (error.includes('Invalid or expired')) {
      return 'This exam link has expired. Ask your instructor to share it again.'
    }
    if (error.includes('Invalid email')) {
      return 'Please enter a valid email address (e.g., name@domain.com).'
    }
    if (error.includes('No answers')) {
      return 'Please answer at least one question before submitting.'
    }
    if (attempt >= 3) {
      return `Submission failed after ${attempt} attempts. This may be a temporary server issue. Please wait a few minutes and try again, or contact your instructor.`
    }
    return `Submission error: ${error}. Retrying...`
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
              {savedEmails.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedEmails.map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => handleEmailSelect(email)}
                        className="px-3 py-1 text-xs bg-muted hover:bg-muted-foreground/20 text-foreground rounded border border-border transition-colors"
                      >
                        {email}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              disabled={loading && !error}
              className="px-8"
            >
              {loading && !error ? 'Submitting...' : error ? 'Retry Submit' : 'Submit Exam'}
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
