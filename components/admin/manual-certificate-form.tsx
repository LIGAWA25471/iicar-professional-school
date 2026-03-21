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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Award, Search, Loader2, AlertCircle } from 'lucide-react'

interface ManualCertificateFormProps {
  onSuccess?: () => void
}

export default function ManualCertificateForm({ onSuccess }: ManualCertificateFormProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'search' | 'form' | 'review'>('search')
  
  // Search step
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // Form step
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [score, setScore] = useState('')
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  
  const [issuingCert, setIssuingCert] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setSearching(true)
    setError(null)
    
    try {
      // Search in profiles by name or id
      const res = await fetch(`/api/admin/search-students?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const handleSelectStudent = useCallback(async (student: any) => {
    setSelectedStudent(student)
    setLoadingPrograms(true)
    setError(null)
    
    try {
      // Fetch all programs
      const res = await fetch('/api/admin/programs')
      if (!res.ok) throw new Error('Failed to fetch programs')
      const data = await res.json()
      setPrograms(data)
      setStep('form')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setLoadingPrograms(false)
    }
  }, [])

  const handleIssueCertificate = useCallback(async () => {
    if (!selectedStudent || !selectedProgram || !score) {
      setError('Please fill in all fields')
      return
    }

    const scoreNum = parseInt(score)
    if (scoreNum < 0 || scoreNum > 100) {
      setError('Score must be between 0 and 100')
      return
    }

    setIssuingCert(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/certificate/issue-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          programId: selectedProgram,
          finalScore: scoreNum,
          certificateLevel: 1,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to issue certificate')
      }

      const certificate = await res.json()
      setSuccess(true)
      
      // Auto-download the certificate
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = `/api/certificate/download/${certificate.cert_id}`
        link.download = `${certificate.cert_id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, 500)

      // Reset after 2 seconds
      setTimeout(() => {
        setOpen(false)
        setStep('search')
        setSearchQuery('')
        setSearchResults([])
        setSelectedStudent(null)
        setSelectedProgram('')
        setScore('')
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setIssuingCert(false)
    }
  }, [selectedStudent, selectedProgram, score, onSuccess])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setStep('search')
      setSearchQuery('')
      setSearchResults([])
      setSelectedStudent(null)
      setSelectedProgram('')
      setScore('')
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Award className="h-4 w-4 mr-2" /> Issue Certificate Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Certificate Manually</DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Search for a student'}
            {step === 'form' && `Configure certificate for ${selectedStudent?.full_name}`}
            {step === 'review' && 'Review and confirm'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Step */}
          {step === 'search' && (
            <>
              <form onSubmit={handleSearch} className="space-y-3">
                <div>
                  <Label htmlFor="search" className="text-sm">Student Name or ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={searching}
                    />
                    <Button type="submit" size="sm" disabled={searching}>
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </form>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left p-2 rounded border border-border hover:bg-muted transition-colors text-sm"
                    >
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.country || 'N/A'}</p>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
              )}
            </>
          )}

          {/* Form Step */}
          {step === 'form' && !loadingPrograms && (
            <>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">{selectedStudent?.full_name}</p>
                  <p className="text-xs text-blue-700">{selectedStudent?.country || 'N/A'}</p>
                </div>

                <div>
                  <Label htmlFor="program" className="text-sm">Program</Label>
                  <select
                    id="program"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  >
                    <option value="">Select a program...</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="score" className="text-sm">Final Score (%)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="0-100"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('search')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep('review')}
                  disabled={!selectedProgram || !score}
                  className="flex-1"
                >
                  Review
                </Button>
              </div>
            </>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <>
              <div className="space-y-3 p-3 rounded-lg bg-muted">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">{selectedStudent?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-medium">{programs.find(p => p.id === selectedProgram)?.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score:</span>
                  <span className="font-medium">{score}%</span>
                </div>
              </div>

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">Certificate issued successfully! Downloading...</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('form')}
                  disabled={issuingCert}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleIssueCertificate}
                  disabled={issuingCert || success}
                  className="flex-1"
                >
                  {issuingCert ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Issuing...
                    </>
                  ) : (
                    'Issue & Download'
                  )}
                </Button>
              </div>
            </>
          )}

          {loadingPrograms && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
