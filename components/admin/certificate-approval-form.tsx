'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'

interface Certificate {
  id: string
  cert_id: string
  final_score: number
  student_id: string
  program_id: string
  approval_status: string
  created_at: string
  issued_at: string | null
  profiles: { id: string; full_name: string; email: string; phone: string; country: string } | null
  programs: { id: string; title: string; description: string } | null
}

interface Signature {
  id: string
  signature_name: string
  signature_title: string
  signature_data: string | null
  is_primary: boolean
}

export default function CertificateApprovalForm({ certificate, signatures }: { certificate: Certificate; signatures: Signature[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [primarySigId, setPrimarySigId] = useState<string | null>(signatures.find(s => s.is_primary)?.id || null)
  const [secondarySigId, setSecondarySigId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    if (!primarySigId) {
      setError('Please select a primary signature')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/certificate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificate.id,
          primarySignatureId: primarySigId,
          secondarySignatureId: secondarySigId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve certificate')
      }

      router.push('/admin/certificates?approved=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/certificate/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificate.id,
          rejectionReason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject certificate')
      }

      router.push('/admin/certificates?rejected=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Student & Certificate Info */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Student Information</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{certificate.profiles?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground break-all">{certificate.profiles?.email || '—'}</p>
            </div>
            {certificate.profiles?.phone && (
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{certificate.profiles.phone}</p>
              </div>
            )}
            {certificate.profiles?.country && (
              <div>
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium text-foreground">{certificate.profiles.country}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Program</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium text-foreground">{certificate.programs?.title || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Final Score</p>
              <p className="font-medium text-foreground text-lg">{certificate.final_score}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Certificate ID</p>
              <p className="font-mono text-xs text-foreground break-all">{certificate.cert_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submission Date</p>
              <p className="font-medium text-foreground text-sm">{new Date(certificate.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Approval Form */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {certificate.approval_status === 'pending' ? (
          <>
            {/* Signatures Selection */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Approve Certificate
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Primary Signature *</label>
                  <select
                    value={primarySigId || ''}
                    onChange={(e) => setPrimarySigId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">Select a signature...</option>
                    {signatures.map(sig => (
                      <option key={sig.id} value={sig.id}>
                        {sig.signature_name} - {sig.signature_title}
                        {sig.is_primary ? ' (Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Secondary Signature (Optional)</label>
                  <select
                    value={secondarySigId || ''}
                    onChange={(e) => setSecondarySigId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">No secondary signature</option>
                    {signatures.map(sig => (
                      <option key={sig.id} value={sig.id}>
                        {sig.signature_name} - {sig.signature_title}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={loading || !primarySigId}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve & Issue Certificate
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Rejection Option */}
            <Card className="p-6 border-red-200">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Or Reject Certificate
              </h3>
              
              <div className="space-y-3">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px]"
                />
                <Button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Reject Certificate
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Certificate Already Processed</h3>
                <p className="text-sm text-green-800 mt-1">
                  This certificate has already been {certificate.approval_status === 'approved' ? 'approved' : 'rejected'}.
                </p>
                {certificate.issued_at && (
                  <p className="text-sm text-green-800 mt-2">
                    Issued: {new Date(certificate.issued_at).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Preview */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Certificate Preview</h3>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">IICAR GLOBAL COLLEGE</p>
            <h2 className="text-2xl font-bold text-amber-900 mb-4">Certificate of Completion</h2>
            <p className="text-foreground mb-2">{certificate.profiles?.full_name || 'Student Name'}</p>
            <p className="text-sm text-muted-foreground mb-2">{certificate.programs?.title || 'Program Title'}</p>
            <p className="text-xs text-muted-foreground">Score: {certificate.final_score}%</p>
            <p className="text-xs text-muted-foreground font-mono mt-3">{certificate.cert_id}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
