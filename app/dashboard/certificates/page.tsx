import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use admin client to bypass RLS — query still scoped to user.id
  const adminDb = createAdminClient()
  const { data: certificates } = await adminDb
    .from('certificates')
    .select('id, cert_id, issued_at, final_score, revoked, programs(title)')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your earned IICAR professional certifications</p>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((cert) => {
            const program = cert.programs as { title: string } | null
            return (
              <div key={cert.id}
                className={`flex flex-col gap-4 rounded-xl border p-6 ${cert.revoked ? 'border-destructive/30 bg-destructive/5 opacity-60' : 'border-accent/30 bg-accent/5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Award className="h-7 w-7 text-accent" />
                  </div>
                  {cert.revoked && (
                    <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">Revoked</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{program?.title}</h3>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{cert.cert_id}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border pt-3">
                  <span>Issued: {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {cert.final_score && <span>Final Score: <strong className="text-foreground">{cert.final_score}%</strong></span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="text-xs flex-1">
                    <Link href={`/api/certificate/download/${cert.cert_id}`} download>
                      <Download className="mr-1.5 h-3 w-3" /> Download PDF
                    </Link>
                  </Button>
                  {!cert.revoked && (
                    <Button asChild variant="outline" size="sm" className="text-xs flex-1">
                      <Link href={`/verify?id=${cert.cert_id}`} target="_blank">
                        Verify <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <Award className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No certificates yet. Complete a program to earn one.</p>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard/programs">Browse Programs</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
