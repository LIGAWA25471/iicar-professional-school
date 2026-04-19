import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Download, Share2, Home, Award } from 'lucide-react'
import Link from 'next/link'

export default async function VerifyEndorsementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const adminDb = createAdminClient()

  // Fetch endorsement with related data
  const { data: endorsement, error } = await adminDb
    .from('recommendations')
    .select(`
      id,
      student_id,
      program_id,
      recommendation_type,
      language,
      generated_at,
      profiles:student_id(full_name),
      programs(title)
    `)
    .eq('id', id)
    .eq('recommendation_type', 'endorsement')
    .single()

  if (error || !endorsement) {
    notFound()
  }

  const languages: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
  ]

  const currentLanguage = languages.find(l => l.code === endorsement.language) || languages[0]
  const studentName = endorsement.profiles?.full_name || 'Student'
  const programTitle = endorsement.programs?.title || 'Professional Program'

  const generatedDate = new Date(endorsement.generated_at).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/admin/recommendation/generate?id=${endorsement.id}`
    link.download = `${studentName}_endorsement_${endorsement.language}.pdf`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Back Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Verify Endorsement</h1>
          <div className="w-[100px]" /> {/* Spacer for alignment */}
        </div>

        {/* Main Card */}
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card shadow-lg">
          {/* Header Section */}
          <div className="border-b border-border bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-8 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-300" />
                  <span className="text-sm font-medium text-green-200">Verified Document</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Professional Endorsement
                </h2>
                <p className="text-sm text-gray-200">This document officially endorses professional competency from IICAR Global College</p>
              </div>
              <Badge className="bg-amber-600 hover:bg-amber-700">ENDORSED</Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6 p-6">
            {/* Student Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Student Name</label>
                <p className="text-lg font-semibold text-foreground">{studentName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Certified Program</label>
                <p className="text-lg font-semibold text-foreground">{programTitle}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Endorsement Type</label>
                <p className="text-lg font-semibold text-foreground capitalize">
                  Professional Competency
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Language</label>
                <p className="text-lg font-semibold text-foreground">{currentLanguage.label}</p>
              </div>
            </div>

            {/* Verification Details */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold text-foreground mb-3">Verification Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document ID:</span>
                  <span className="font-mono font-semibold text-foreground">{endorsement.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issued Date:</span>
                  <span className="font-semibold text-foreground">{generatedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuing Institution:</span>
                  <span className="font-semibold text-foreground">IICAR Global College</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endorsed By:</span>
                  <span className="font-semibold text-foreground">Julia Thornton, Office of the Registrar</span>
                </div>
              </div>
            </div>

            {/* Endorsement Summary */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
              <h3 className="font-semibold text-foreground mb-2">About This Endorsement</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This professional endorsement certifies that {studentName} has successfully completed and demonstrated mastery in {programTitle}. 
                This endorsement verifies professional competency and readiness for advancement in the field, authorized by IICAR Global College's Office of the Registrar.
              </p>
            </div>

            {/* Competencies Badge */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Technical<br />Proficiency</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Professional<br />Competency</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-2xl font-bold text-foreground">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Career<br />Ready</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share Endorsement
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/40 px-6 py-4 text-center text-sm text-muted-foreground">
            <p>This professional endorsement is valid and verifiable using the document ID through IICAR Global College.</p>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 text-center">
          <div className="inline-block rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-6 py-4">
            <p className="text-sm font-medium text-foreground mb-2">
              🏆 Endorsed by IICAR Global College
            </p>
            <p className="text-xs text-muted-foreground">
              This endorsement is officially recognized and verifiable
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return {
    title: `Verify Professional Endorsement - IICAR Global College`,
    description: `View and verify your professional endorsement from IICAR Global College using document ID: ${id}`,
  }
}
