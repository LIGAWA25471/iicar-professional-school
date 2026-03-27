import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignatureManagerClient } from '@/components/admin/signature-manager-client'

export default async function SignaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  // Get existing signatures
  const { data: signatures } = await adminDb
    .from('admin_signatures')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/certificates">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Certificates
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-primary">Manage Signatures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draw and save signatures to be used on certificates
        </p>
      </div>

      <SignatureManagerClient initialSignatures={signatures || []} />
    </div>
  )
}
