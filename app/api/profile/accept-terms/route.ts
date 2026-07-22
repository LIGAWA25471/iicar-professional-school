import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update profile to mark terms as accepted
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating terms:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept terms' },
        { status: 500 }
      )
    }

    console.log('[v0] Terms accepted by user:', user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in accept terms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
