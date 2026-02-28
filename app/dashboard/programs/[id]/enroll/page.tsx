import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Lock, CreditCard } from 'lucide-react'
import EnrollButton from '@/components/enroll-button'

export default async function EnrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: programId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use service-role to bypass RLS when fetching the program
  const adminDb = createAdminClient()
  const { data: program } = await adminDb
    .from('programs')
    .select('id, title, description, price_cents, duration_weeks, level, passing_score')
    .eq('id', programId)
    .eq('is_published', true)
    .single()
  if (!program) notFound()

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()

  if (existing && existing.status === 'active') redirect(`/dashboard/programs/${programId}`)

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-bold text-primary">Enroll in Program</h1>

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">{program.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{program.description}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm border-t border-border pt-4">
          <span className="text-muted-foreground">Level: <strong className="text-foreground capitalize">{program.level}</strong></span>
          {program.duration_weeks && (
            <span className="text-muted-foreground">Duration: <strong className="text-foreground">{program.duration_weeks} weeks</strong></span>
          )}
          <span className="text-muted-foreground">Passing score: <strong className="text-foreground">{program.passing_score}%</strong></span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-2xl font-bold text-primary">
              {program.price_cents === 0 ? 'Free' : `KES ${(program.price_cents / 100).toLocaleString()}`}
            </p>
            <p className="text-xs text-muted-foreground">one-time payment</p>
          </div>
          <EnrollButton programId={program.id} price={program.price_cents} title={program.title} />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Structured self-paced curriculum</div>
        <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> Secure, proctored assessments</div>
        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Verifiable digital certificate on completion</div>
      </div>

      <Button asChild variant="ghost" className="text-muted-foreground">
        <Link href={`/dashboard/programs/${programId}`}>Cancel</Link>
      </Button>
    </div>
  )
}
