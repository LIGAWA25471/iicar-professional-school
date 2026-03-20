import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, Clock, CheckCircle, XCircle, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RevokeCertButton from '@/components/admin/revoke-cert-button'
import { CertificateApprovalActions } from '@/components/admin/certificate-approval-actions'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  // Get pending certificates first, then approved ones
  const { data: certs } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, approval_status, approved_at, student_id, profiles(full_name), programs(title)')
    .order('approval_status', { ascending: true }) // pending first
    .order('issued_at', { ascending: false })

  // Get available signatures
  const { data: signatures } = await adminDb
    .from('admin_signatures')
    .select('id, signature_name, signature_title, is_primary')
    .order('is_primary', { ascending: false })

  const pendingCount = certs?.filter(c => c.approval_status === 'pending').length ?? 0
  const approvedCount = certs?.filter(c => c.approval_status === 'approved').length ?? 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount > 0 && <span className="text-amber-600 font-medium">{pendingCount} pending approval</span>}
            {pendingCount > 0 && approvedCount > 0 && ' • '}
            {approvedCount > 0 && <span>{approvedCount} issued</span>}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/certificates/signatures">
            <Settings className="h-4 w-4 mr-2" /> Manage Signatures
          </Link>
        </Button>
      </div>

      {/* Pending Approval Section */}
      {pendingCount > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Pending Approval ({pendingCount})</h2>
          </div>
          <div className="space-y-3">
            {certs?.filter(c => c.approval_status === 'pending').map((cert) => {
              const profile = cert.profiles as { full_name: string } | null
              const program = cert.programs as { title: string } | null
              return (
                <div key={cert.id} className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-amber-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{profile?.full_name ?? '—'}</p>
                    <p className="text-sm text-muted-foreground truncate">{program?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Score: {cert.final_score}% • ID: {cert.cert_id}</p>
                  </div>
                  <CertificateApprovalActions 
                    certificateId={cert.id} 
                    signatures={signatures || []}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Certificates Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Certificate ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {certs?.map((cert) => {
              const profile = cert.profiles as { full_name: string } | null
              const program = cert.programs as { title: string } | null
              return (
                <tr key={cert.id} className={`hover:bg-muted/30 transition-colors ${cert.revoked ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{cert.cert_id}</td>
                  <td className="px-5 py-3 text-foreground">{profile?.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-foreground truncate max-w-[180px]">{program?.title}</td>
                  <td className="px-5 py-3 text-foreground">{cert.final_score}%</td>
                  <td className="px-5 py-3">
                    {cert.revoked ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" /> Revoked
                      </Badge>
                    ) : cert.approval_status === 'pending' ? (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    ) : cert.approval_status === 'rejected' ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                    {cert.approval_status === 'approved' && !cert.revoked && (
                      <>
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/api/certificate/download/${cert.cert_id}`} download>
                            <Download className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/verify?id=${cert.cert_id}`} target="_blank">Verify</Link>
                        </Button>
                        <RevokeCertButton certId={cert.id} />
                      </>
                    )}
                    {cert.approval_status === 'pending' && (
                      <span className="text-xs text-muted-foreground">Awaiting approval</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!certs || certs.length === 0) && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No certificates yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
