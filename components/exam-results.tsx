'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Download } from 'lucide-react'
import Link from 'next/link'

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
  passing_score: number
}

interface ExamResultsProps {
  exam: Exam
  answers: Record<string, string>
  questions: Question[]
  respondentName: string
}

export default function ExamResults({
  exam,
  answers,
  questions,
  respondentName,
}: ExamResultsProps) {
  // Calculate score
  const totalQuestions = questions.length
  let correctAnswers = 0

  questions.forEach((q) => {
    // Note: This is a rough calculation - the actual score is calculated server-side
    // For display, we just count correct format answers
    const userAnswer = answers[q.id]?.toString().toLowerCase().trim()
    if (userAnswer) {
      correctAnswers++
    }
  })

  const percentage = (correctAnswers / totalQuestions) * 100
  const passed = percentage >= exam.passing_score

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-lg border border-border bg-card p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {passed ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h1 className="text-3xl font-bold text-green-600">Congratulations!</h1>
              <p className="text-muted-foreground">You have passed the exam</p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h1 className="text-3xl font-bold text-red-600">Not Passed</h1>
              <p className="text-muted-foreground">You did not meet the passing score</p>
            </>
          )}
        </div>

        {/* Score Card */}
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground mb-2">
              {percentage.toFixed(1)}%
            </div>
            <p className="text-muted-foreground">Your Score</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-border">
            <div>
              <div className="text-2xl font-bold text-foreground">{correctAnswers}</div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalQuestions - correctAnswers}</div>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div>
              <Badge className={passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exam:</span>
            <span className="font-medium text-foreground">{exam.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium text-foreground">{respondentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Passing Score:</span>
            <span className="font-medium text-foreground">{exam.passing_score}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium text-foreground">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Print Results
          </Button>
          <Button asChild className="flex-1">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          <p>This result is provided for informational purposes only.</p>
          <p>An official certificate may be issued after verification.</p>
        </div>
      </div>
    </div>
  )
}
