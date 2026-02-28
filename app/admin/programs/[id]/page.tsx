import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Users, BookOpen } from 'lucide-react'
import ProgramPublishToggle from '@/components/admin/program-publish-toggle'
import ProgramModulesManager from '@/components/admin/program-modules-manager'
import AdminManualEnrollModal from '@/components/admin/manual-enroll-modal'

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  const { data: program } = await adminDb
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (!program) notFound()

  const { data: modules } = await adminDb
    .from('modules')
    .select('*')
    .eq('program_id', id)
    .order('sort_order', { ascending: true })

  const { count: enrollmentCount } = await adminDb
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', id)

  // All non-admin students for the enroll modal
  const { data: students } = await adminDb
    .from('profiles')
    .select('id, full_name, phone')
    .eq('is_admin', false)
    .order('full_name', { ascending: true })

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground -ml-2">
        <Link href="/admin/programs"><ChevronLeft className="h-4 w-4 mr-1" />All Programs</Link>
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="secondary" className="capitalize text-xs">{program.level}</Badge>
            <Badge variant={program.is_published ? 'default' : 'outline'} className="text-xs">
              {program.is_published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-primary text-balance">{program.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{program.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{program.duration_weeks} weeks</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{enrollmentCount ?? 0} enrolled</span>
            <span>Pass: {program.passing_score}%</span>
            <span className="font-medium text-foreground">{program.price_cents === 0 ? 'Free' : `KES ${(program.price_cents / 100).toLocaleString()}`}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <AdminManualEnrollModal
            fixedProgramId={id}
            fixedProgramTitle={program.title}
            fixedPriceCents={program.price_cents}
            students={students ?? []}
          />
          <ProgramPublishToggle programId={id} isPublished={program.is_published} />
        </div>
      </div>

      <ProgramModulesManager
        programId={id}
        programTitle={program.title}
        programDescription={program.description}
        programLevel={program.level}
        durationWeeks={program.duration_weeks}
        initialModules={modules ?? []}
      />
    </div>
  )
}
