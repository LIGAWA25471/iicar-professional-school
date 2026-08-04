import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const LANGUAGES = {
  fr: 'French',
  pt: 'Portuguese',
  ar: 'Arabic',
  es: 'Spanish',
  en: 'English',
  ur: 'Urdu',
  ru: 'Russian',
  bn: 'Bengali',
  hi: 'Hindi',
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch translation request with payment
  const { data: translation, error } = await supabase
    .from('translation_requests')
    .select(`
      *,
      payment:translation_payments(*)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !translation) {
    redirect('/dashboard/translations')
  }

  const amountUSD = translation.total_cost_cents / 100
  const createdDate = new Date(translation.created_at).toLocaleDateString()
  const paidDate = translation.payment_completed_at ? new Date(translation.payment_completed_at).toLocaleDateString() : 'N/A'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">Your translation request has been received and payment confirmed.</p>
      </div>

      {/* Receipt */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <h2 className="text-2xl font-bold mb-2">Payment Receipt</h2>
          <p className="text-primary-foreground/80">Receipt #: {translation.id.substring(0, 12).toUpperCase()}</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer Email</p>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>

          <hr className="border-border" />

          {/* Document Details */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Document Details</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Document Name</p>
                  <p className="text-foreground">{translation.document_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                  <p className="text-foreground font-medium">{translation.total_pages}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Languages</p>
                  <p className="text-foreground font-medium">{translation.languages_requested.length}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Languages Requested</p>
                <div className="grid grid-cols-3 gap-2">
                  {translation.languages_requested.map((lang: string) => (
                    <div key={lang} className="bg-muted/50 rounded px-2 py-1 text-sm text-foreground">
                      {LANGUAGES[lang as keyof typeof LANGUAGES] || lang}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Pricing Breakdown */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Pricing Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="text-foreground">{translation.total_pages}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Languages</span>
                <span className="text-foreground">{translation.languages_requested.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate per page per language</span>
                <span className="text-foreground">$25</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Calculation</span>
                <span className="text-foreground">{translation.total_pages} × {translation.languages_requested.length} × $25</span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Payment Summary */}
          <div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-lg font-semibold text-foreground">Total Amount</span>
              <span className="text-3xl font-bold text-primary">${amountUSD.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Payment Method: Paystack (KES)</p>
              <p>Reference: {translation.paystack_reference}</p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Request Date</p>
              <p className="text-foreground font-medium">{createdDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="text-foreground font-medium">{paidDate}</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm text-blue-900">
            <p className="font-medium">What Happens Next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You will receive a confirmation email shortly</li>
              <li>Translation processing will begin immediately</li>
              <li>Translated documents will be delivered within 24-72 hours</li>
              <li>A download link will be sent to your email</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-muted/30 border-t border-border p-6 flex gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/translations">Back to Translations</Link>
          </Button>
          <Button asChild className="flex-1">
            <a href={`mailto:${user.email}`}>
              <Download className="h-4 w-4 mr-2" />
              Email Receipt
            </a>
          </Button>
        </div>
      </div>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>If you have any questions, please contact our support team</p>
      </div>
    </div>
  )
}
