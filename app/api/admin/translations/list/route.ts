import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status with the service-role client so RLS cannot hide the profile.
    const adminDb = createAdminClient()
    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[v0] Admin profile lookup error:', profileError)
      return NextResponse.json({ error: 'Failed to verify administrator access' }, { status: 500 })
    }

    if (!profile?.is_admin && user.user_metadata?.is_admin !== true) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch every translation request with the service-role client.
    const { data: requests, error } = await adminDb
      .from('translation_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching translations:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[v0] Admin translations list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
