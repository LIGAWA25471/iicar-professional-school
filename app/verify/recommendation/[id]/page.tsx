import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Download, Share2, Home } from 'lucide-react'
import Link from 'next/link'

export default async function VerifyRecommendationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const adminDb = createAdminClient()

  // Fetch recommendation with related data
  const { data: recommendation, error } = await adminDb
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
    .single()

  if (error || !recommendation) {
    notFound()
  }

  const languages: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
  ]

  const currentLanguage = languages.find(l => l.code === recommendation.language) || languages[0]
  const studentName = recommendation.profiles?.full_name || 'Student'
  const programTitle = recommendation.programs?.title || 'Professional Program'

  const generatedDate = new Date(recommendation.generated_at).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/admin/recommendation/generate?id=${recommendation.id}`
    link.download = `${studentName}_recommendation_${recommendation.language}.pdf`
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
          <h1 className="text-3xl font-bold text-foreground">Verify Recommendation</h1>
          <div className="w-[100px]" /> {/* Spacer for alignment */}
        </div>

        {/* Main Card */}
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card shadow-lg">
          {/* Header Section */}
          <div className="border-b border-border bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Verified Document</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {recommendation.recommendation_type === 'recommendation'
                    ? 'Letter of Recommendation'
                    : 'Professional Endorsement'}
                </h2>
                <p className="text-sm text-gray-300">This document has been officially issued by IICAR Global College</p>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">VERIFIED</Badge>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase">Program</label>
                <p className="text-lg font-semibold text-foreground">{programTitle}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Document Type</label>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {recommendation.recommendation_type}
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
                  <span className="font-mono font-semibold text-foreground">{recommendation.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated Date:</span>
                  <span className="font-semibold text-foreground">{generatedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuing Institution:</span>
                  <span className="font-semibold text-foreground">IICAR Global College</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrar:</span>
                  <span className="font-semibold text-foreground">Julia Thornton</span>
                </div>
              </div>
            </div>

            {/* Document Description */}
            <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
              <h3 className="font-semibold text-foreground mb-2">About This Document</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.recommendation_type === 'recommendation'
                  ? `This letter of recommendation certifies that ${studentName} has successfully completed professional training in ${programTitle} and is recommended for positions requiring these competencies.`
                  : `This professional endorsement certifies that ${studentName} has demonstrated mastery and competency in ${programTitle} as offered by IICAR Global College.`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 gap-2" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/40 px-6 py-4 text-center text-sm text-muted-foreground">
            <p>This document is valid and can be verified using the ID above on the IICAR Global College website.</p>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 text-center">
          <div className="inline-block rounded-lg border border-border bg-card px-6 py-4">
            <p className="text-sm font-medium text-foreground mb-2">
              ✓ Verified by IICAR Global College
            </p>
            <p className="text-xs text-muted-foreground">
              Document verification is secured and auditable
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
    title: `Verify Recommendation - IICAR Global College`,
    description: `View and verify your professional recommendation from IICAR Global College using document ID: ${id}`,
  }
}
