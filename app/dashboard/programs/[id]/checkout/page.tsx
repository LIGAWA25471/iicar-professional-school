import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock, Shield, CheckCircle } from 'lucide-react'
import { EnrollmentPayment } from '@/components/enrollment-payment'

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Redirect if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('student_id', user.id)
    .eq('program_id', programId)
    .single()

  if (existing && existing.status === 'active') {
    redirect(`/dashboard/programs/${programId}`)
  }

  // Don't allow free programs on checkout page
  if (program.price_cents === 0) {
    redirect(`/dashboard/programs/${programId}/enroll`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/programs/${programId}/enroll`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Program
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary mt-4">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your enrollment in this professional certification program</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main checkout form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Payment Details</h2>
              <EnrollmentPayment
                programId={program.id}
                programTitle={program.title}
                amount={program.price_cents / 100}
                onSuccess={() => {
                  // Redirect happens in the component
                }}
              />
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-6">Order Summary</h3>

              {/* Program details */}
              <div className="pb-6 border-b border-border">
                <h4 className="font-medium text-foreground mb-2">{program.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{program.description}</p>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span>Level: <strong className="text-foreground capitalize">{program.level}</strong></span>
                  {program.duration_weeks && (
                    <span>Duration: <strong className="text-foreground">{program.duration_weeks} weeks</strong></span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="py-6 border-b border-border">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    USD ${Math.round((program.price_cents / 100) / 134).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    USD ${Math.round((program.price_cents / 100) / 134).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">Secure Payment</p>
                    <p className="text-muted-foreground">Processed via Paystack</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">SSL Encrypted</p>
                    <p className="text-muted-foreground">Your data is protected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">USA Accredited</p>
                    <p className="text-muted-foreground">Professional credential</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
