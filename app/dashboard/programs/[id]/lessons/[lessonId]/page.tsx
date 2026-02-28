import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LessonCompleteButton from '@/components/lesson-complete-button'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id: programId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use admin client to bypass RLS — enrollment check still scoped to user.id
  const adminDb = createAdminClient()

  const { data: enrollment } = await adminDb
    .from('enrollments')
    .select('status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()

  if (!enrollment || enrollment.status !== 'active') redirect(`/dashboard/programs/${programId}`)

  // Use admin client to bypass RLS on lessons
  const { data: lesson } = await adminDb
    .from('lessons')
    .select('id, title, objectives, content, module_id, modules(id, title, program_id, sort_order)')
    .eq('id', lessonId)
    .eq('is_published', true)
    .single()

  if (!lesson) notFound()

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  const isCompleted = progress?.completed === true
  const module_ = lesson.modules as { id: string; title: string; program_id: string; sort_order: number } | null

  // Fetch sibling lessons in the same module for prev/next navigation
  const { data: siblingLessons } = await adminDb
    .from('lessons')
    .select('id, title, sort_order')
    .eq('module_id', lesson.module_id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const currentIdx = siblingLessons?.findIndex(l => l.id === lessonId) ?? -1
  const prevLesson = currentIdx > 0 ? siblingLessons![currentIdx - 1] : null
  const nextLesson = currentIdx >= 0 && currentIdx < (siblingLessons?.length ?? 0) - 1 ? siblingLessons![currentIdx + 1] : null

  // Parse content — stored as plain text with section separators
  const rawContent = lesson.content ?? ''
  const keyPointsMatch = rawContent.match(/\n\nKey Points:\n([\s\S]*?)(?:\n\nPractical Activity:|$)/)
  const practicalMatch = rawContent.match(/\n\nPractical Activity:\n([\s\S]*)$/)
  const mainContent = rawContent
    .replace(/\n\nKey Points:\n[\s\S]*$/, '')
    .trim()
  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1].split('\n').map(l => l.replace(/^• /, '').trim()).filter(Boolean)
    : []
  const practicalActivity = practicalMatch ? practicalMatch[1].trim() : null

  // Objectives stored as newline-separated items
  const objectives = lesson.objectives
    ? lesson.objectives.split('\n').map(o => o.replace(/^• /, '').trim()).filter(Boolean)
    : []

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href={`/dashboard/programs/${programId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Program
          </Link>
        </Button>
      </div>

      {/* Lesson card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border px-8 py-5">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {module_?.title}
          </p>
          <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>
        </div>

        <div className="p-8 flex flex-col gap-7">
          {/* Learning objectives */}
          {objectives.length > 0 && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent mb-3 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Learning Objectives
              </h3>
              <ul className="flex flex-col gap-2">
                {objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main content */}
          {mainContent && (
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {mainContent}
            </div>
          )}

          {/* Key points */}
          {keyPoints.length > 0 && (
            <div className="rounded-lg bg-muted/40 border border-border p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Key Points
              </h3>
              <ul className="flex flex-col gap-2">
                {keyPoints.map((kp, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {kp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical activity */}
          {practicalActivity && (
            <div className="rounded-lg bg-primary/5 border border-primary/15 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Practical Activity</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{practicalActivity}</p>
            </div>
          )}

          {!mainContent && !keyPoints.length && !practicalActivity && (
            <p className="text-sm text-muted-foreground">Content coming soon.</p>
          )}
        </div>
      </div>

      {/* Complete + prev/next */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isCompleted ? 'Lesson completed' : 'Mark this lesson as complete'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCompleted ? 'You have already completed this lesson' : 'Mark done when you finish reading'}
            </p>
          </div>
          <LessonCompleteButton lessonId={lessonId} programId={programId} completed={isCompleted} />
        </div>

        {/* Prev / Next navigation */}
        {(prevLesson || nextLesson) && (
          <div className="flex items-center justify-between gap-3">
            {prevLesson ? (
              <Button asChild variant="outline" size="sm" className="flex-1 justify-start">
                <Link href={`/dashboard/programs/${programId}/lessons/${prevLesson.id}`}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1 shrink-0" />
                  <span className="truncate">{prevLesson.title}</span>
                </Link>
              </Button>
            ) : <div className="flex-1" />}
            {nextLesson ? (
              <Button asChild size="sm" className="flex-1 justify-end bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href={`/dashboard/programs/${programId}/lessons/${nextLesson.id}`}>
                  <span className="truncate">{nextLesson.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1 shrink-0" />
                </Link>
              </Button>
            ) : <div className="flex-1" />}
          </div>
        )}
      </div>
    </div>
  )
}

