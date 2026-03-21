import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, CheckCircle, XCircle, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RevokeCertButton from '@/components/admin/revoke-cert-button'
import ManualCertificateForm from '@/components/admin/manual-certificate-form'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  // Get pending certificates first, then approved ones
  // Note: These columns come from the original schema + the approval workflow migration
  const { data: certs, error: certsError } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, student_id, program_id, certificate_level')
    .order('issued_at', { ascending: false })

  if (certsError) {
    console.error('[v0] Certificate fetch error:', certsError)
  }

  // Fetch related data separately to avoid foreign key issues
  const certificatesWithDetails = await Promise.all(
    (certs || []).map(async (cert) => {
      const [profileRes, programRes] = await Promise.all([
        adminDb.from('profiles').select('full_name').eq('id', cert.student_id).single(),
        adminDb.from('programs').select('title').eq('id', cert.program_id).single(),
      ])
      return {
        ...cert,
        profiles: profileRes.data,
        programs: programRes.data,
      }
    })
  )

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
            {certificatesWithDetails.length} certificate(s) on file
          </p>
        </div>
        <div className="flex gap-2">
          <ManualCertificateForm />
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/certificates/signatures">
              <Settings className="h-4 w-4 mr-2" /> Manage Signatures
            </Link>
          </Button>
        </div>
      </div>

      {/* All Certificates Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Certificate ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Level</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {certificatesWithDetails.map((cert) => {
              const profile = cert.profiles as { full_name: string } | null
              const program = cert.programs as { title: string } | null
              const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
              const levelName = LEVEL_NAMES[(cert.certificate_level || 1) - 1]
              return (
                <tr key={cert.id} className={`hover:bg-muted/30 transition-colors ${cert.revoked ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{cert.cert_id}</td>
                  <td className="px-5 py-3 text-foreground">{profile?.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-foreground truncate max-w-[180px]">{program?.title}</td>
                  <td className="px-5 py-3 text-foreground">
                    <Badge variant="outline" className="text-xs">
                      Level {cert.certificate_level || 1}: {levelName}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-foreground">{cert.final_score ?? '—'}%</td>
                  <td className="px-5 py-3">
                    {cert.revoked ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" /> Revoked
                      </Badge>
                    ) : cert.issued_at ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Issued
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                    {cert.issued_at && !cert.revoked && (
                      <>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                          const link = document.createElement('a')
                          link.href = `/api/certificate/download/${cert.cert_id}`
                          link.download = `${cert.cert_id}_certificate.pdf`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/verify?id=${cert.cert_id}`} target="_blank">Verify</Link>
                        </Button>
                        <RevokeCertButton certId={cert.id} />
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!certificatesWithDetails || certificatesWithDetails.length === 0) && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No certificates yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
