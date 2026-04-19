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
    programs: { title: string; id: string } | null
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

  const handleGenerateAll = async (type: 'recommendation' | 'endorsement') => {
    for (const enrollment of completedEnrollments) {
      if (enrollment.programs) {
        setLoading(`${enrollment.programs.id}-${type}`)
        
        try {
          const res = await fetch('/api/admin/recommendation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId,
              programId: enrollment.programs.id,
              type,
              language: selectedLang,
            }),
          })

          if (res.ok) {
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${studentName}_${enrollment.programs.title}_${type}_${selectedLang}.pdf`
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
              {completedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded">
                  <span className="text-sm">{enrollment.programs?.title}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={loading === `${enrollment.programs?.id}-recommendation`}
                      onClick={() => handleGenerateRecommendation(enrollment.programs?.id || '', 'recommendation')}
                    >
                      {loading === `${enrollment.programs?.id}-recommendation` ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                      ) : (
                        <><Download className="h-3 w-3 mr-1" />Recommendation</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={loading === `${enrollment.programs?.id}-endorsement`}
                      onClick={() => handleGenerateRecommendation(enrollment.programs?.id || '', 'endorsement')}
                    >
                      {loading === `${enrollment.programs?.id}-endorsement` ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
                      ) : (
                        <><Download className="h-3 w-3 mr-1" />Endorsement</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <h4 className="text-sm font-medium">Generate All at Once:</h4>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={loading !== null}
                onClick={() => handleGenerateAll('recommendation')}
              >
                {loading?.includes('recommendation') ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Download All Recommendations</>
                )}
              </Button>
              <Button
                className="flex-1"
                disabled={loading !== null}
                onClick={() => handleGenerateAll('endorsement')}
              >
                {loading?.includes('endorsement') ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Download All Endorsements</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
