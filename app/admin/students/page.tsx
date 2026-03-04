import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ChevronRight } from 'lucide-react'

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  let query = adminDb
    .from('profiles')
    .select('id, full_name, country, phone, created_at, is_admin')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data: students } = await query

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">{students?.length ?? 0} registered students</p>
        </div>
        <form className="flex gap-2">
          <Input name="q" defaultValue={q} placeholder="Search by name…" className="w-64" />
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students?.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{s.full_name ?? '—'}</p>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{s.country ?? '—'}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href={`/admin/students/${s.id}`}><ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(!students || students.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
