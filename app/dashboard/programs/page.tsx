import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ChevronRight, Award, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string }>
}) {
  const { level, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use service-role to bypass RLS for published program reads
  const adminDb = createAdminClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, status, enrolled_at, programs(id, title, description, duration_weeks, level, price_cents)')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  let query = adminDb
    .from('programs')
    .select('id, title, description, price_cents, duration_weeks, level')
    .eq('is_published', true)
    .order('title')

  if (level) query = query.eq('level', level)

  const { data: available } = await query

  const enrolledIds = new Set(enrollments?.map(e => (e.programs as { id: string }).id))

  let unenrolled = available?.filter(p => !enrolledIds.has(p.id)) ?? []
  if (q) {
    const lower = q.toLowerCase()
    unenrolled = unenrolled.filter(p =>
      p.title.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower)
    )
  }

  const levels = ['beginner', 'intermediate', 'advanced']

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Programs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and enroll in professional certification programs
        </p>
      </div>

      {/* MY ENROLLMENTS */}
      {enrollments && enrollments.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-foreground">My Enrollments</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => {
              const p = e.programs as { id: string; title: string; description: string; duration_weeks: number; level: string } | null
              return (
                <Link key={e.id} href={`/dashboard/programs/${p?.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant={e.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {e.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{p?.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{p?.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      <Clock className="h-3 w-3" />{p?.duration_weeks}w
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* BROWSE AVAILABLE */}
      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-foreground">
            Available Programs
            <span className="ml-2 text-xs font-normal text-muted-foreground">({unenrolled.length})</span>
          </h2>
          {/* LEVEL FILTER */}
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/programs"
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${!level ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
              All
            </Link>
            {levels.map(l => (
              <Link key={l} href={`/dashboard/programs?level=${l}`}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${level === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                {l}
              </Link>
            ))}
          </div>
        </div>

        {unenrolled.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unenrolled.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${LEVEL_COLORS[p.level] ?? 'bg-muted text-muted-foreground'}`}>
                    {p.level}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {p.price_cents === 0 ? 'Free' : `KES ${(p.price_cents / 100).toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{p.duration_weeks} weeks
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Link href={`/dashboard/programs/${p.id}/enroll`}>Enroll Now</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No programs found. Try a different filter.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/programs">Clear filters</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
