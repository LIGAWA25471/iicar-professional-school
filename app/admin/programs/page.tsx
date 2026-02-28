import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil } from 'lucide-react'
import SeedProgramsButton from '@/components/admin/seed-programs-button'

export default async function AdminProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use service-role client to bypass RLS and always see all programs
  const adminDb = createAdminClient()
  const { data: programs, error } = await adminDb
    .from('programs')
    .select('id, title, level, price_cents, duration_weeks, is_published, passing_score, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{programs?.length ?? 0} certification programs</p>
        </div>
        <div className="flex items-center gap-3">
          <SeedProgramsButton />
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/admin/programs/new"><Plus className="h-4 w-4 mr-2" /> New Program</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {programs?.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.duration_weeks}w · Pass: {p.passing_score}%</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="capitalize text-xs">{p.level}</Badge>
                </td>
                <td className="px-6 py-4 text-foreground">
                  {p.price_cents === 0 ? 'Free' : `KES ${(p.price_cents / 100).toLocaleString()}`}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={p.is_published ? 'default' : 'outline'} className="text-xs">
                    {p.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href={`/admin/programs/${p.id}`}><Pencil className="h-3.5 w-3.5 mr-1" /> Manage</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(!programs || programs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground text-sm">
                  No programs yet. Use the &quot;Seed 30 Sample Programs&quot; button above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
