'use client'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: Record<string, string> | null
  difficulty: string
}

interface ExamQuestionProps {
  question: Question
  answer: string
  onChange: (answer: string) => void
}

export default function ExamQuestion({ question, answer, onChange }: ExamQuestionProps) {
  if (question.question_type === 'multiple_choice') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{question.question_text}</h3>
        <div className="space-y-3">
          {question.options && Object.entries(question.options).map(([key, value]) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted transition-colors">
              <input
                type="radio"
                name={question.id}
                value={key}
                checked={answer === key}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1"
              />
              <span className="text-foreground">
                <strong>{key}.</strong> {value}
              </span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (question.question_type === 'true_false') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{question.question_text}</h3>
        <div className="flex gap-4">
          {['true', 'false'].map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answer === option}
                onChange={(e) => onChange(e.target.value)}
              />
              <span className="text-foreground capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  // Short answer
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{question.question_text}</h3>
      <textarea
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-border rounded-lg text-foreground bg-background text-sm"
        placeholder="Type your answer here..."
        rows={6}
      />
    </div>
  )
}
