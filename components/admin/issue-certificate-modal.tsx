'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, Loader2 } from 'lucide-react'

interface IssueCertificateModalProps {
  studentId: string
  studentName: string
  studentEmail?: string
}

export default function IssueCertificateModal({
  studentId,
  studentName,
  studentEmail,
}: IssueCertificateModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [finalScore, setFinalScore] = useState<string>('75')
  const [issuingCert, setIssuingCert] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successCertId, setSuccessCertId] = useState<string | null>(null)

  const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
  const LEVEL_DESCRIPTIONS = [
    'Basic understanding of core concepts',
    'Practical application skills',
    'Advanced expertise',
    'Professional certification',
    'Expert level mastery',
  ]

  const handleOpenChange = useCallback(async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setSuccessCertId(null)
      setSelectedLevel(1)
      setFinalScore('75')
      setSelectedEnrollment(null)
      
      try {
        const res = await fetch(`/api/admin/student/${studentId}/enrollments`)
        if (!res.ok) throw new Error('Failed to fetch enrollments')
        const data = await res.json()
        setEnrollments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enrollments')
      } finally {
        setLoading(false)
      }
    }
  }, [studentId])

  const handleIssueCertificate = useCallback(async () => {
    if (!selectedEnrollment || !finalScore) return

    const score = parseInt(finalScore)
    if (isNaN(score) || score < 0 || score > 100) {
      setError('Score must be a number between 0 and 100')
      return
    }

    setIssuingCert(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/certificate/issue-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          programId: selectedEnrollment,
          finalScore: score,
          certificateLevel: selectedLevel,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue certificate')
      }

      setSuccessCertId(data.certId)
      setSuccess(true)
      
      // Auto-download PDF after 1 second
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = `/api/certificate/download/${data.certId}`
        link.download = `${data.certId}_certificate.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, 1000)

      setTimeout(() => {
        setOpen(false)
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setIssuingCert(false)
    }
  }, [selectedEnrollment, selectedLevel, studentId, finalScore])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <Award className="h-3.5 w-3.5" /> Issue Cert
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
          <DialogDescription>
            Issue a certificate to {studentName}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Certificate issued successfully!</p>
            <p className="text-xs text-muted-foreground mt-1">Email sent to {studentEmail}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Program Enrollment</label>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : enrollments.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {enrollments.map((enrollment) => (
                    <button
                      key={enrollment.id}
                      onClick={() => setSelectedEnrollment(enrollment.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedEnrollment === enrollment.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{enrollment.programs?.title}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {enrollment.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No enrollments found</p>
              )}
            </div>

            {selectedEnrollment && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Final Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={finalScore}
                    onChange={(e) => setFinalScore(e.target.value)}
                    placeholder="75"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Enter a score between 0 and 100</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Certificate Level</label>
                  <div className="grid grid-cols-5 gap-2">
                    {LEVEL_NAMES.map((name, idx) => (
                      <button
                        key={idx + 1}
                        onClick={() => setSelectedLevel(idx + 1)}
                        className={`p-2 rounded text-center transition-colors ${
                          selectedLevel === idx + 1
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border hover:border-primary'
                        }`}
                        title={LEVEL_DESCRIPTIONS[idx]}
                      >
                        <p className="text-xs font-bold">L{idx + 1}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {LEVEL_NAMES[selectedLevel - 1]}: {LEVEL_DESCRIPTIONS[selectedLevel - 1]}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={issuingCert}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIssueCertificate}
                disabled={!selectedEnrollment || issuingCert}
                className="flex-1"
              >
                {issuingCert && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Issue Certificate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
