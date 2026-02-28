import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Award, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', user.id)
      .single()

    if (error?.code === 'PGRST116') {
      // Profile doesn't exist, create one
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
      }).throwOnError()
    }

    // If user is admin, redirect to admin
    if (profile?.is_admin) {
      redirect('/admin')
    }
  } catch (err) {
    console.log('[v0] Profile check/creation error:', err)
  }

  // For all other cases, show student home
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, status, enrolled_at, programs(id, title, description, duration_weeks)')
    .eq('student_id', user.id)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })
    .limit(5)

  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, cert_id, issued_at, programs(title)')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(3)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const activeCount = enrollments?.filter(e => e.status === 'active').length ?? 0
  const completedCount = enrollments?.filter(e => e.status === 'completed').length ?? 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your learning overview</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Programs', value: activeCount, icon: BookOpen, color: 'text-primary' },
          { label: 'Completed', value: completedCount, icon: Award, color: 'text-green-600' },
          { label: 'Certificates', value: certificates?.length ?? 0, icon: Award, color: 'text-accent' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ACTIVE PROGRAMS */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Active Programs</h2>
          <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
            <Link href="/dashboard/programs">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        {enrollments && enrollments.filter(e => e.status === 'active').length > 0 ? (
          <div className="flex flex-col gap-3">
            {enrollments.filter(e => e.status === 'active').map((e) => {
              const program = e.programs as { id: string; title: string; description: string; duration_weeks: number } | null
              return (
                <Link key={e.id} href={`/dashboard/programs/${program?.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{program?.title}</p>
                      <p className="text-xs text-muted-foreground">{program?.duration_weeks} weeks</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No active programs yet</p>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/#programs">Browse Programs</Link>
            </Button>
          </div>
        )}
      </div>

      {/* RECENT CERTIFICATES */}
      {certificates && certificates.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Certificates</h2>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link href="/dashboard/certificates">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {certificates.map((cert) => {
              const program = cert.programs as { title: string } | null
              return (
                <div key={cert.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <Award className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{program?.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{cert.cert_id}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link href={`/verify?id=${cert.cert_id}`}>Verify</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

