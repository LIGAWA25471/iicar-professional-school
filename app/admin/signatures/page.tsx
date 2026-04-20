import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SignaturesPageClient from '@/components/admin/signatures-page-client'

export default async function SignaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  // Get all signatures
  const { data: signatures, error } = await adminDb
    .from('signatures')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching signatures:', error)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Admin
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-primary">Manage Signatures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, draw, or type signatures to be used on recommendation letters and endorsements
        </p>
      </div>

      <SignaturesPageClient initialSignatures={signatures || []} />
    </div>
  )
}
