import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Award } from 'lucide-react'
import AdminManualEnrollModal from '@/components/admin/manual-enroll-modal'
import IssueCertFromEnrollment from '@/components/admin/issue-cert-from-enrollment'

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  const { data: profile } = await adminDb
    .from('profiles')
    .select('id, full_name, email, country, phone, created_at')
    .eq('id', studentId)
    .single()
  if (!profile) notFound()

  const { data: enrollments } = await adminDb
    .from('enrollments')
    .select('id, status, enrolled_at, completed_at, programs(title)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })

  const { data: certificates } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, programs(title)')
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false })

  // All programs for the enroll modal
  const { data: programs } = await adminDb
    .from('programs')
    .select('id, title, price_cents')
    .order('title', { ascending: true })

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="w-fit text-muted-foreground">
        <Link href="/admin/students"><ChevronLeft className="h-4 w-4 mr-1" /> Students</Link>
      </Button>

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-primary">{profile.full_name ?? 'Unknown Student'}</h1>
          <AdminManualEnrollModal
            fixedStudentId={studentId}
            fixedStudentName={profile.full_name ?? 'This student'}
            programs={programs ?? []}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{profile.country ?? '—'}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground font-mono">{profile.phone ?? '—'}</span></div>
          <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-foreground">Enrollments ({enrollments?.length ?? 0})</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Program</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Enrolled</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments?.map((e) => {
                const program = e.programs as { title: string } | null
                return (
                  <tr key={e.id}>
                    <td className="px-5 py-3 text-foreground">{program?.title}</td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={e.status === 'active' ? 'default' : e.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize text-xs"
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <IssueCertFromEnrollment
                        studentId={studentId}
                        studentName={profile.full_name ?? 'Student'}
                        studentEmail={profile.email ?? ''}
                        enrollmentId={e.id}
                        programId={e.program_id}
                        enrollmentStatus={e.status}
                      />
                    </td>
                  </tr>
                )
              })}
              {(!enrollments || enrollments.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-muted-foreground text-sm">No enrollments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-foreground">Certificates ({certificates?.length ?? 0})</h2>
        <div className="flex flex-col gap-3">
          {certificates?.map((cert) => {
            const program = cert.programs as { title: string } | null
            return (
              <div key={cert.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{program?.title}</p>
                    <p className="text-xs font-mono text-muted-foreground">{cert.cert_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {cert.revoked && <Badge variant="destructive" className="text-xs">Revoked</Badge>}
                  <span className="text-xs text-muted-foreground">{cert.final_score}%</span>
                </div>
              </div>
            )
          })}
          {(!certificates || certificates.length === 0) && (
            <p className="text-sm text-muted-foreground">No certificates issued</p>
          )}
        </div>
      </div>
    </div>
  )
}
