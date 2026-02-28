import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, Award, TrendingUp, ChevronRight } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { count: studentCount },
    { count: programCount },
    { count: certCount },
    { count: enrollCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('revoked', false),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const stats = [
    { label: 'Total Students', value: studentCount ?? 0, icon: Users, href: '/admin/students' },
    { label: 'Programs', value: programCount ?? 0, icon: BookOpen, href: '/admin/programs' },
    { label: 'Active Enrollments', value: enrollCount ?? 0, icon: TrendingUp, href: '/admin/students' },
    { label: 'Certificates Issued', value: certCount ?? 0, icon: Award, href: '/admin/certificates' },
  ]

  const { data: recentStudents } = await supabase
    .from('profiles')
    .select('id, full_name, country, created_at')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentCerts } = await supabase
    .from('certificates')
    .select('id, cert_id, issued_at, profiles(full_name), programs(title)')
    .eq('revoked', false)
    .order('issued_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform snapshot and recent activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Students */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground text-sm">Recent Students</h2>
            <Link href="/admin/students" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentStudents?.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.full_name ?? 'No name'}</p>
                  <p className="text-xs text-muted-foreground">{s.country ?? '—'}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {(!recentStudents || recentStudents.length === 0) && (
              <p className="px-6 py-4 text-sm text-muted-foreground">No students yet</p>
            )}
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground text-sm">Recent Certificates</h2>
            <Link href="/admin/certificates" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentCerts?.map((cert) => {
              const profile = cert.profiles as { full_name: string } | null
              const program = cert.programs as { title: string } | null
              return (
                <div key={cert.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{program?.title}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{cert.cert_id.slice(-8)}</span>
                </div>
              )
            })}
            {(!recentCerts || recentCerts.length === 0) && (
              <p className="px-6 py-4 text-sm text-muted-foreground">No certificates issued yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
