'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Loader2 } from 'lucide-react'
import { RecommendationLanguage } from '@/lib/recommendation-translations'

interface RecommendationGeneratorProps {
  studentId: string
  studentName: string
  enrollments: Array<{
    id: string
    program_id: string
    programs: { id: string; title: string } | null
    status: string
  }>
}

const LANGUAGES: { code: RecommendationLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
]

export default function RecommendationGenerator({
  studentId,
  studentName,
  enrollments,
}: RecommendationGeneratorProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedLang, setSelectedLang] = useState<RecommendationLanguage>('en')
  const [error, setError] = useState<string | null>(null)

  const completedEnrollments = enrollments.filter(e => e.status === 'completed' || e.status === 'active')

  const handleGenerateRecommendation = async (programId: string, type: 'recommendation' | 'endorsement') => {
    setLoading(`${programId}-${type}`)
    setError(null)

    try {
      const res = await fetch('/api/admin/recommendation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          programId,
          type,
          language: selectedLang,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate recommendation')
      }

      // Download PDF
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${studentName}_${type}_${selectedLang}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendation')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateCombined = async (type: 'recommendation' | 'endorsement') => {
    setLoading(`combined-${type}`)
    setError(null)

    try {
      const res = await fetch('/api/admin/recommendation/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          type,
          language: selectedLang,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate combined document')
      }

      // Download combined PDF
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${studentName}_${type}_all_courses_${selectedLang}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate combined document')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateAll = async (type: 'recommendation' | 'endorsement') => {
    for (const enrollment of completedEnrollments) {
      const programId = enrollment.programs?.id || enrollment.program_id
      if (programId) {
        setLoading(`${programId}-${type}`)
        
        try {
          const res = await fetch('/api/admin/recommendation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId,
              programId,
              type,
              language: selectedLang,
            }),
          })

          if (res.ok) {
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${studentName}_${enrollment.programs?.title}_${type}_${selectedLang}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (err) {
          console.error('Error generating recommendation:', err)
        } finally {
          setLoading(null)
        }
      }
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Generate Recommendations & Endorsements</h3>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {completedEnrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Student has no completed enrollments</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Select Language:</label>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedLang === lang.code
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:border-primary'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Individual Documents:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {completedEnrollments.map((enrollment) => {
                const programId = enrollment.programs?.id || enrollment.program_id
                return (
                  <div key={enrollment.id} className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded">
                    <span className="text-sm">{enrollment.programs?.title}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={loading === `${programId}-recommendation`}
                        onClick={() => handleGenerateRecommendation(programId, 'recommendation')}
                      >
                        {loading === `${programId}-recommendation` ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                        ) : (
                          <><Download className="h-3 w-3 mr-1" />Recommendation</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={loading === `${programId}-endorsement`}
                        onClick={() => handleGenerateRecommendation(programId, 'endorsement')}
                      >
                        {loading === `${programId}-endorsement` ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                        ) : (
                          <><Download className="h-3 w-3 mr-1" />Endorsement</>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Combined Document (All Courses in One):</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading === 'combined-recommendation' || completedEnrollments.length === 0}
                  onClick={() => handleGenerateCombined('recommendation')}
                >
                  {loading === 'combined-recommendation' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />Combined Recommendation</>
                  )}
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={loading === 'combined-endorsement' || completedEnrollments.length === 0}
                  onClick={() => handleGenerateCombined('endorsement')}
                >
                  {loading === 'combined-endorsement' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />Combined Endorsement</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Single document listing all {completedEnrollments.length} completed certification(s)
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium mb-3">Individual Documents (Separate File for Each Course):</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={loading !== null && !loading?.includes('individual')}
                  onClick={() => handleGenerateAll('recommendation')}
                >
                  {loading?.includes('recommendation') && !loading?.includes('combined') ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />All Recommendations Separately</>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={loading !== null && !loading?.includes('individual')}
                  onClick={() => handleGenerateAll('endorsement')}
                >
                  {loading?.includes('endorsement') && !loading?.includes('combined') ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />All Endorsements Separately</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Separate document for each certification (sequential downloads)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
