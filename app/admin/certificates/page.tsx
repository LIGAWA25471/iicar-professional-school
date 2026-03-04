import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RevokeCertButton from '@/components/admin/revoke-cert-button'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  const { data: certs } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, student_id, profiles(full_name), programs(title)')
    .order('issued_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">{certs?.length ?? 0} certificates issued</p>
      </div>
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
                    <Badge variant={cert.revoked ? 'destructive' : 'default'} className="text-xs">
                      {cert.revoked ? 'Revoked' : 'Valid'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                      <Link href={`/api/certificate/download/${cert.cert_id}`} download>
                        <Download className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                      <Link href={`/verify?id=${cert.cert_id}`} target="_blank">Verify</Link>
                    </Button>
                    {!cert.revoked && <RevokeCertButton certId={cert.id} />}
                  </td>
                </tr>
              )
            })}
            {(!certs || certs.length === 0) && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No certificates issued yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
