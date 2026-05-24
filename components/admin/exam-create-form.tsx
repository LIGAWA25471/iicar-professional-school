'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react'

export default function ExamCreateForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

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

  const [manualQuestions, setManualQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    difficulty: 'medium',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: 'A',
    explanation: '',
    marks: 1,
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
      const endpoint = mode === 'ai' ? '/api/admin/exams/create' : '/api/admin/exams/manual'
      const payload = mode === 'ai' 
        ? formData 
        : { ...formData, questions: manualQuestions }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const addQuestion = () => {
    if (!currentQuestion.question_text || !currentQuestion.explanation) {
      setError('Please fill in question text and explanation')
      return
    }
    setManualQuestions([...manualQuestions, currentQuestion])
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      difficulty: 'medium',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: 'A',
      explanation: '',
      marks: 1,
    })
    setError(null)
  }

  const removeQuestion = (index: number) => {
    setManualQuestions(manualQuestions.filter((_, i) => i !== index))
  }

  if (success && shareToken) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Exam Created Successfully!</h3>
            <p className="mt-2 text-sm text-muted-foreground mb-4">
              Your exam has been created {mode === 'ai' ? 'with AI-generated questions' : 'successfully'}. Share this link with test takers:
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
      {/* Mode Selection */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => { setMode('ai'); setError(null) }}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            mode === 'ai' 
              ? 'border-primary text-foreground' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          AI Generation
        </button>
        <button
          type="button"
          onClick={() => { setMode('manual'); setError(null) }}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            mode === 'manual' 
              ? 'border-primary text-foreground' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Manual Questions
        </button>
      </div>

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

      {mode === 'manual' && (
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-foreground mb-4">Add Questions Manually</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Question Text *</label>
              <Textarea
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                placeholder="Enter the exam question..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Type *</label>
                <select
                  value={currentQuestion.question_type}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question_type: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Difficulty *</label>
                <select
                  value={currentQuestion.difficulty}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {currentQuestion.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Options *</label>
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <Input
                    key={key}
                    placeholder={`Option ${key}`}
                    value={value as string}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion,
                      options: {...currentQuestion.options, [key]: e.target.value}
                    })}
                  />
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Correct Answer *</label>
              {currentQuestion.question_type === 'multiple_choice' && (
                <select
                  value={currentQuestion.correct_answer}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              )}
              {currentQuestion.question_type === 'true_false' && (
                <select
                  value={currentQuestion.correct_answer}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}
              {currentQuestion.question_type === 'short_answer' && (
                <Input
                  placeholder="Enter the correct answer"
                  value={currentQuestion.correct_answer}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Explanation *</label>
              <Textarea
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>

            <Button
              type="button"
              onClick={addQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question ({manualQuestions.length}/50-100)
            </Button>

            {manualQuestions.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-medium text-foreground">Added Questions:</h4>
                {manualQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-muted p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Q{idx + 1}: {q.question_text.substring(0, 60)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">Type: {q.question_type} | Difficulty: {q.difficulty}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || !formData.title || !formData.subject || (mode === 'manual' && manualQuestions.length === 0)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Exam...
            </>
          ) : mode === 'ai' ? (
            'Create Exam with AI Questions'
          ) : (
            'Create Exam with Manual Questions'
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
