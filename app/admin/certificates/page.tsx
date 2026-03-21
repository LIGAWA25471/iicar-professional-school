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

  // Query only columns that exist in the original schema
  // pending = issued_at is NULL
  // approved = issued_at is NOT NULL
  const { data: certs, error: certsError } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, student_id, program_id')
    .order('issued_at', { ascending: true }) // Pending (NULL) first, then issued in order

  if (certsError) {
    console.error('[v0] Certificate fetch error:', certsError)
  }

  console.log('[v0] Fetched certificates:', certs?.length || 0)

  // Fetch related data separately to avoid foreign key issues
  const certificatesWithDetails = await Promise.all(
    (certs || []).map(async (cert) => {
      const [profileRes, programRes] = await Promise.all([
        adminDb.from('profiles').select('full_name, email').eq('id', cert.student_id).single(),
        adminDb.from('programs').select('title').eq('id', cert.program_id).single(),
      ])
      return {
        ...cert,
        profiles: profileRes.data,
        programs: programRes.data,
      }
    })
  )

  // Separate pending from issued certificates
  // Pending: issued_at is null
  // Issued: issued_at is not null
  const pendingCerts = certificatesWithDetails.filter(c => c.issued_at === null)
  const issuedCerts = certificatesWithDetails.filter(c => c.issued_at !== null)

  // Get available signatures
  const { data: signatures } = await adminDb
    .from('admin_signatures')
    .select('id, signature_name, signature_title, is_primary')
    .order('is_primary', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCerts.length > 0 && <span className="text-amber-600 font-medium">{pendingCerts.length} pending approval</span>}
            {pendingCerts.length > 0 && issuedCerts.length > 0 && ' • '}
            {issuedCerts.length > 0 && <span>{issuedCerts.length} issued</span>}
            {pendingCerts.length === 0 && issuedCerts.length === 0 && 'No certificates yet'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/certificates/signatures">
            <Settings className="h-4 w-4 mr-2" /> Manage Signatures
          </Link>
        </Button>
      </div>

      {/* Pending Certificates Alert */}
      {pendingCerts.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Pending Approval ({pendingCerts.length})</h2>
          </div>
          <div className="space-y-3">
            {pendingCerts.map((cert) => {
              const profile = cert.profiles as { full_name: string; email: string } | null
              const program = cert.programs as { title: string } | null
              return (
                <div key={cert.id} className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{profile?.full_name ?? 'Unknown Student'}</p>
                    <p className="text-sm text-muted-foreground">{program?.title ?? 'Unknown Program'}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Score: <strong className="text-foreground">{cert.final_score}%</strong></span>
                      <span>•</span>
                      <span>ID: <strong className="font-mono text-foreground">{cert.cert_id}</strong></span>
                      {profile?.email && (
                        <>
                          <span>•</span>
                          <span className="text-foreground">{profile.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Link href={`/admin/certificates/${cert.id}/approve`}>
                        Review & Sign
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Certificates Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">All Certificates</h2>
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
              {certificatesWithDetails.map((cert) => {
                const profile = cert.profiles as { full_name: string } | null
                const program = cert.programs as { title: string } | null
                return (
                  <tr key={cert.id} className={`hover:bg-muted/30 transition-colors ${cert.revoked ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{cert.cert_id}</td>
                    <td className="px-5 py-3 text-foreground">{profile?.full_name ?? '—'}</td>
                    <td className="px-5 py-3 text-foreground truncate max-w-[180px]">{program?.title}</td>
                    <td className="px-5 py-3 text-foreground">{cert.final_score ?? '—'}%</td>
                    <td className="px-5 py-3">
                      {cert.revoked ? (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Revoked
                        </Badge>
                      ) : cert.issued_at === null ? (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" /> Pending Review
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Issued
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                      {cert.issued_at && !cert.revoked && (
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
                      {cert.issued_at === null && (
                        <Button asChild size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
                          <Link href={`/admin/certificates/${cert.id}/approve`}>Review & Sign</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {(!certificatesWithDetails || certificatesWithDetails.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No certificates yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
