'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import useSWR from 'swr'

interface StudentEnrollment {
  id: string
  student_id: string
  program_id: string
  status: string
  created_at: string
  profiles: { full_name: string; email: string }
  programs: { title: string }
  existingCertificate?: {
    id: string
    cert_id: string
    certificate_level: number
    issued_at: string | null
  }
}

const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
const LEVEL_DESCRIPTIONS = [
  'Basic understanding of core concepts',
  'Solid understanding and practical application',
  'Deep expertise and advanced problem-solving',
  'Professional competency and leadership',
  'Expert mastery and industry recognition',
]

export function IssueCertificateForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Search students
  const { data: searchResults, isLoading: isSearching } = useSWR(
    searchQuery ? `/api/admin/enrollments/search?search=${encodeURIComponent(searchQuery)}` : null,
    fetch
  )

  // Get specific enrollment details
  const { data: enrollmentDetails } = useSWR(
    selectedStudentId && selectedProgramId
      ? `/api/admin/enrollments/search?studentId=${selectedStudentId}&programId=${selectedProgramId}`
      : null,
    fetch
  )

  const handleIssue = useCallback(async () => {
    if (!selectedStudentId || !selectedProgramId) {
      setErrorMessage('Please select a student and program')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/admin/certificate/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          programId: selectedProgramId,
          certificateLevel: selectedLevel,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to issue certificate')
      }

      const result = await response.json()
      setSuccessMessage(`Certificate issued successfully! Email sent to ${result.email} with cert ID: ${result.certId}`)
      setSelectedStudentId(null)
      setSelectedProgramId(null)
      setSelectedLevel(1)
      setSearchQuery('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to issue certificate')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedStudentId, selectedProgramId, selectedLevel])

  const selectedStudent = searchResults?.find((s: any) => s.id === selectedStudentId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Search & Issue Certificate</h2>
        <p className="text-sm text-muted-foreground">Search for a student to manually issue a certificate</p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Search Students */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
          Select Student
        </h3>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {searchQuery && !isSearching && searchResults && searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
              {searchResults.map((student: any) => (
                <div key={student.id} className="space-y-2">
                  <button
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedStudentId === student.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </button>

                  {selectedStudentId === student.id && student.enrollments && student.enrollments.length > 0 && (
                    <div className="ml-3 space-y-2 py-2 border-l-2 border-primary pl-3">
                      {student.enrollments.map((enrollment: any) => (
                        <button
                          key={enrollment.id}
                          onClick={() => setSelectedProgramId(enrollment.program_id)}
                          className={`block w-full text-left p-2 rounded text-sm transition-colors ${
                            selectedProgramId === enrollment.program_id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <p className="font-medium">{enrollment.programs.title}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {enrollment.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery && !isSearching && searchResults && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
          )}

          {selectedStudent && selectedProgramId && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-900">Selected:</p>
              <p className="text-sm text-green-800">{selectedStudent.full_name}</p>
              <p className="text-xs text-green-700 mt-1">
                {selectedStudent.enrollments.find((e: any) => e.program_id === selectedProgramId)?.programs.title}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Step 2: Select Certificate Level */}
      {selectedStudentId && selectedProgramId && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</span>
            Select Certificate Level
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {LEVEL_NAMES.map((name, idx) => {
              const level = idx + 1
              const isSelected = selectedLevel === level
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-bold text-lg mb-1">Level {level}</p>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{LEVEL_DESCRIPTIONS[idx]}</p>
                </button>
              )
            })}
          </div>

          {enrollmentDetails?.existingCertificate && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This student already has a certificate for this program (Level {enrollmentDetails.existingCertificate.certificate_level}) issued on {new Date(enrollmentDetails.existingCertificate.issued_at).toLocaleDateString()}. Issuing a new certificate will update the existing one.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      {/* Step 3: Review & Issue */}
      {selectedStudentId && selectedProgramId && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">3</span>
            Review & Issue
          </h3>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{selectedStudent?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{selectedStudent?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program:</span>
              <span className="font-medium">
                {selectedStudent?.enrollments.find((e: any) => e.program_id === selectedProgramId)?.programs.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certificate Level:</span>
              <Badge className="bg-primary">{LEVEL_NAMES[selectedLevel - 1]}</Badge>
            </div>
          </div>

          <Button
            onClick={handleIssue}
            disabled={isSubmitting}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Issuing Certificate...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Issue Certificate & Send Email
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  )
}
