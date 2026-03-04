import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle, Circle, ChevronRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use service-role to bypass RLS for reading program content
  const adminDb = createAdminClient()
  const { data: program } = await adminDb
    .from('programs')
    .select('*, modules(id, title, description, sort_order, lessons(id, title, is_published, sort_order))')
    .eq('id', id)
    .single()

  if (!program) notFound()

  const { data: enrollment } = await adminDb
    .from('enrollments')
    .select('id, status')
    .eq('student_id', user.id)
    .eq('program_id', id)
    .single()

  const isEnrolled = enrollment?.status === 'active' || enrollment?.status === 'completed'

  const { data: progressRows } = await adminDb
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('student_id', user.id)

  const completedLessons = new Set(progressRows?.filter(p => p.completed).map(p => p.lesson_id))

  const sortedModules = (program.modules ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

  const totalLessons = sortedModules.reduce((sum: number, m: { lessons: { is_published: boolean }[] }) =>
    sum + (m.lessons?.filter((l: { is_published: boolean }) => l.is_published).length ?? 0), 0)
  const completedCount = sortedModules.reduce((sum: number, m: { lessons: { id: string; is_published: boolean }[] }) =>
    sum + (m.lessons?.filter((l: { id: string; is_published: boolean }) => l.is_published && completedLessons.has(l.id)).length ?? 0), 0)
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="capitalize text-xs">{program.level}</Badge>
          {program.duration_weeks && <span className="text-xs text-muted-foreground">{program.duration_weeks} weeks</span>}
        </div>
        <h1 className="text-2xl font-bold text-primary">{program.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{program.description}</p>
      </div>

      {isEnrolled && totalLessons > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{completedCount} of {totalLessons} lessons completed</p>
        </div>
      )}

      {!isEnrolled && (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 items-center text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Enroll to access lessons and assessments</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/dashboard/programs/${id}/enroll`}>
              {program.price_cents === 0 ? 'Enroll Free' : `Enroll — KES ${(program.price_cents / 100).toLocaleString()}`}
            </Link>
          </Button>
        </div>
      )}

      {/* MODULES & LESSONS */}
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-foreground">Curriculum</h2>
        {sortedModules.map((module: { id: string; title: string; description: string; lessons: { id: string; title: string; is_published: boolean; sort_order: number }[] }) => {
          const lessons = (module.lessons ?? [])
            .filter(l => l.is_published)
            .sort((a, b) => a.sort_order - b.sort_order)

          // description is stored as JSON — extract the human-readable summary
          let moduleDesc = module.description ?? ''
          try {
            const parsed = JSON.parse(module.description ?? '{}')
            if (parsed.summary) moduleDesc = parsed.summary
          } catch { /* plain text */ }

          return (
            <div key={module.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between bg-primary/5 px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{module.title}</h3>
                  {moduleDesc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{moduleDesc}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-1">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
                </div>
                {isEnrolled && (
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href={`/dashboard/programs/${id}/quiz/${module.id}`}>Take Quiz</Link>
                  </Button>
                )}
              </div>
              <div className="divide-y divide-border">
                {lessons.map((lesson) => {
                  const done = completedLessons.has(lesson.id)
                  return (
                    <div key={lesson.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        {done ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                        <span className="text-sm text-foreground">{lesson.title}</span>
                      </div>
                      {isEnrolled ? (
                        <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                          <Link href={`/dashboard/programs/${id}/lessons/${lesson.id}`}>
                            {done ? 'Review' : 'Start'} <ChevronRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                  )
                })}
                {lessons.length === 0 && (
                  <p className="px-5 py-4 text-xs text-muted-foreground">No lessons published yet</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FINAL EXAM */}
      {isEnrolled && progress >= 80 && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Final Exam</p>
            <p className="text-xs text-muted-foreground mt-1">Passing score: {program.passing_score}% · Max {program.max_attempts} attempts</p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/dashboard/programs/${id}/exam`}>Take Final Exam</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
