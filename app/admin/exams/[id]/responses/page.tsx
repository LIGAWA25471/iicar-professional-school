import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, BarChart3, UserCircle2 } from 'lucide-react'

export default async function ExamResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  const { data: exam, error: examError } = await adminDb
    .from('exams')
    .select('id, title, subject, status, total_questions, passing_score')
    .eq('id', examId)
    .single()

  if (examError || !exam) notFound()

  const { data: attempts, error: attemptsError } = await adminDb
    .from('exam_attempts')
    .select('id, respondent_name, respondent_email, score, passed, time_taken_seconds, created_at')
    .eq('exam_id', examId)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
        <Link href="/admin/exams"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Special Exams</Link>
      </Button>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Special Exam Responses</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{exam.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Subject: {exam.subject} · Status: {exam.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="capitalize">{exam.status}</Badge>
            <Badge className="text-sm">Questions: {exam.total_questions}</Badge>
            <Badge className="text-sm">Passing: {exam.passing_score}%</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Responses</p>
              <p className="text-xs text-muted-foreground">Review all submissions for this special exam.</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {attemptsError ? 'Unable to load responses' : `${attempts?.length ?? 0} response${attempts?.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>

        {attemptsError ? (
          <div className="p-6 text-sm text-amber-900 bg-amber-50">
            Failed to load exam responses. Please try again later.
          </div>
        ) : attempts && attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Respondent</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Passed</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2 text-foreground">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>{attempt.respondent_name || 'Anonymous'}</span>
                    </td>
                    <td className="px-6 py-4 text-foreground">{attempt.respondent_email || '—'}</td>
                    <td className="px-6 py-4 text-foreground">{attempt.score?.toFixed(2) ?? '—'}%</td>
                    <td className="px-6 py-4">
                      <Badge className={attempt.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {attempt.passed ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">{attempt.time_taken_seconds ? `${attempt.time_taken_seconds}s` : '—'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{attempt.created_at ? new Date(attempt.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No responses have been submitted yet for this exam.
          </div>
        )}
      </div>
    </div>
  )
}
