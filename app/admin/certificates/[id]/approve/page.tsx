import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CertificateApprovalForm from '@/components/admin/certificate-approval-form'

export default async function CertificateApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminDb = createAdminClient()

  // Fetch certificate details
  const { data: cert, error } = await adminDb
    .from('certificates')
    .select(`
      id, cert_id, final_score, student_id, program_id, approval_status, created_at, issued_at,
      profiles(id, full_name, email, phone, country),
      programs(id, title, description)
    `)
    .eq('id', id)
    .single()

  if (error || !cert) {
    redirect('/admin/certificates')
  }

  // Fetch available signatures
  const { data: signatures } = await adminDb
    .from('admin_signatures')
    .select('id, signature_name, signature_title, signature_data, is_primary')
    .order('is_primary', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/certificates">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Review & Approve Certificate</h1>
          <p className="mt-1 text-sm text-muted-foreground">Certificate ID: {cert.cert_id}</p>
        </div>
      </div>

      <CertificateApprovalForm
        certificate={cert}
        signatures={signatures || []}
      />
    </div>
  )
}
