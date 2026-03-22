import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, ExternalLink, Download, Printer, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CertificateCard from '@/components/dashboard/certificate-card'

interface Certificate {
  id: string
  cert_id: string
  issued_at: string | null
  final_score: number
  revoked: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  programs: { title: string } | null
}

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()
  const { data: certificates } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, approval_status, rejection_reason, programs(title)')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })

  const certs = (certificates || []) as Certificate[]
  const pendingCerts = certs.filter(c => c.approval_status === 'pending')
  const approvedCerts = certs.filter(c => c.approval_status === 'approved')
  const rejectedCerts = certs.filter(c => c.approval_status === 'rejected')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your earned IICAR professional certifications</p>
      </div>

      {/* Pending Certificates */}
      {pendingCerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Pending Approval ({pendingCerts.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pendingCerts.map((cert) => (
              <div key={cert.id} className="flex flex-col gap-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-600">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-amber-600 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{cert.programs?.title}</h3>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{cert.cert_id}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-amber-200 pt-3">
                  {cert.final_score && <span>Final Score: <strong className="text-foreground">{cert.final_score}%</strong></span>}
                </div>
                <Alert className="border-amber-300 bg-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-800" />
                  <AlertDescription className="text-xs text-amber-800">
                    Your certificate is being reviewed by our admin team. You'll receive an email once approved.
                  </AlertDescription>
                </Alert>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Certificates */}
      {approvedCerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approved Certificates ({approvedCerts.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {approvedCerts.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Certificates */}
      {rejectedCerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Rejected Certificates ({rejectedCerts.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {rejectedCerts.map((cert) => (
              <div key={cert.id} className="flex flex-col gap-4 rounded-xl border-2 border-red-200 bg-red-50 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-red-600 text-white">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{cert.programs?.title}</h3>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{cert.cert_id}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-red-200 pt-3">
                  {cert.final_score && <span>Final Score: <strong className="text-foreground">{cert.final_score}%</strong></span>}
                </div>
                {cert.rejection_reason && (
                  <Alert className="border-red-300 bg-red-100">
                    <AlertCircle className="h-4 w-4 text-red-800" />
                    <AlertDescription className="text-xs text-red-800">
                      {cert.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}
                <Button asChild size="sm" className="text-xs w-full bg-red-600 hover:bg-red-700 text-white">
                  <Link href="/dashboard/support">Contact Support</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {certs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <Award className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No certificates yet. Complete a program and pass the final exam to earn one.</p>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard/programs">Browse Programs</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
