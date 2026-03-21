'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Award, AlertCircle, Loader2 } from 'lucide-react'

interface IssueCertFromEnrollmentProps {
  studentId: string
  studentName: string
  studentEmail: string
  enrollmentId: string
  programId: string
  enrollmentStatus: 'active' | 'completed' | string
}

const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
const LEVEL_DESCRIPTIONS = [
  'Basic completion of program requirements',
  'Solid understanding with practical application',
  'Advanced skills and knowledge demonstrated',
  'Professional-level expertise and competency',
  'Expert-level mastery and achievement',
]

export default function IssueCertFromEnrollment({
  studentId,
  studentName,
  studentEmail,
  enrollmentId,
  programId,
  enrollmentStatus,
}: IssueCertFromEnrollmentProps) {
  const [open, setOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleIssue = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/certificate/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          programId,
          certificateLevel: selectedLevel,
          source: 'manual_admin',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to issue certificate')
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <Award className="h-3 w-3 mr-1" /> Issue Cert
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
          <DialogDescription>
            Manually issue a certificate for {studentName}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-green-700" />
            </div>
            <p className="font-semibold text-green-700">Certificate Issued!</p>
            <p className="text-sm text-muted-foreground">Email sent to {studentEmail}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-xs">{studentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enrollment:</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {enrollmentStatus}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Certificate Level</label>
              <div className="grid grid-cols-5 gap-2">
                {LEVEL_NAMES.map((name, idx) => {
                  const level = idx + 1
                  const isSelected = selectedLevel === level
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`p-2 rounded border text-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-bold text-sm">L{level}</p>
                      <p className="text-xs text-muted-foreground">{name}</p>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{LEVEL_DESCRIPTIONS[selectedLevel - 1]}</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleIssue} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Issue Certificate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
