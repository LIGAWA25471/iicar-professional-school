'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LANGUAGES = [
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'en', name: 'English' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ru', name: 'Russian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'hi', name: 'Hindi' },
]

const PRICE_PER_PAGE_PER_LANGUAGE = 25 // USD

export default function TranslationPortal() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [pages, setPages] = useState(1)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const totalCost = pages * selectedLanguages.length * PRICE_PER_PAGE_PER_LANGUAGE

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setError('')
    }
  }

  const handleLanguageToggle = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!file) {
      setError('Please select a document to translate')
      return
    }

    if (pages < 1) {
      setError('Please enter a valid number of pages')
      return
    }

    if (selectedLanguages.length === 0) {
      setError('Please select at least one language')
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', fileName)
      formData.append('pages', pages.toString())
      formData.append('languages', JSON.stringify(selectedLanguages))

      console.log('[v0] Submitting translation request:', { fileName, pages, languages: selectedLanguages, cost: totalCost })

      const response = await fetch('/api/translations/request', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('[v0] Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create translation request')
      }

      setSuccess(`Translation request created! Redirecting to payment...`)
      setTimeout(() => {
        router.push(`/dashboard/translations/${data.requestId}/checkout`)
      }, 1500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit request'
      setError(errorMsg)
      console.error('[v0] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Translation Service</h1>
        <p className="text-muted-foreground">Upload your documents and get them translated to multiple languages</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Upload Document</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt"
                  />
                  <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {fileName || 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX</span>
                  </label>
                </div>
              </div>

              {/* Pages Input */}
              <div>
                <label htmlFor="pages" className="text-sm font-semibold text-foreground mb-2 block">Number of Pages</label>
                <Input
                  id="pages"
                  type="number"
                  min="1"
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full"
                  placeholder="Enter number of pages"
                />
              </div>

              {/* Languages Selection */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Select Languages</label>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageToggle(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedLanguages.includes(lang.code)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !file || pages < 1 || selectedLanguages.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Summary Section */}
        <div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 sticky top-6 space-y-4">
            <h3 className="font-semibold text-foreground">Order Summary</h3>

            {file && (
              <div className="flex gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-muted-foreground">{pages} page{pages !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {selectedLanguages.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">Languages:</p>
                <div className="space-y-1">
                  {selectedLanguages.map(code => (
                    <p key={code} className="text-foreground">
                      • {LANGUAGES.find(l => l.code === code)?.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-primary/10 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pages:</span>
                <span className="text-foreground">{pages}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Languages:</span>
                <span className="text-foreground">{selectedLanguages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price per page:</span>
                <span className="text-foreground">${PRICE_PER_PAGE_PER_LANGUAGE}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">${(pages * selectedLanguages.length * PRICE_PER_PAGE_PER_LANGUAGE).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-primary rounded-lg p-4 text-primary-foreground">
              <p className="text-xs text-primary-foreground/80 mb-1">Total Amount</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>• Payment processed via Paystack</p>
              <p>• Receipt sent immediately</p>
              <p>• Translations ready in 24-72 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
