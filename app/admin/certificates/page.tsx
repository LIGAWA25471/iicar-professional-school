import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ManualCertificateForm from '@/components/admin/manual-certificate-form'
import CertificateTableRow from '@/components/admin/certificate-table-row'

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
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary">Certificates</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error loading certificates</p>
          <p className="text-sm mt-1">{certsError.message}</p>
        </div>
      </div>
    )
  }

  // Fetch related data efficiently - get all profiles and programs once
  const { data: allProfiles } = await adminDb
    .from('profiles')
    .select('id, full_name')

  const { data: allPrograms } = await adminDb
    .from('programs')
    .select('id, title')

  // Create lookup maps for O(1) access
  const profilesMap = new Map(allProfiles?.map(p => [p.id, p]) || [])
  const programsMap = new Map(allPrograms?.map(p => [p.id, p]) || [])

  // Map certificates with their related data
  const certificatesWithDetails = (certs || []).map(cert => ({
    ...cert,
    profiles: profilesMap.get(cert.student_id) || null,
    programs: programsMap.get(cert.program_id) || null,
  }))

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
            {certificatesWithDetails.map((cert) => (
              <CertificateTableRow
                key={cert.id}
                cert={cert}
                profile={cert.profiles}
                program={cert.programs}
              />
            ))}
            {(!certificatesWithDetails || certificatesWithDetails.length === 0) && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No certificates yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
