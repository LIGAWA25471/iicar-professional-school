import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TranslationCheckout } from '@/components/translation-checkout'

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  // Fetch translation request using admin client to bypass RLS
  const adminDb = createAdminClient()
  const { data: translationRequest, error } = await adminDb
    .from('translation_requests')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !translationRequest) {
    redirect('/dashboard/translations')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Complete Payment</h1>
        <p className="text-muted-foreground">Review your order and complete payment</p>
      </div>

      <TranslationCheckout translation={translationRequest} />
    </div>
  )
}
