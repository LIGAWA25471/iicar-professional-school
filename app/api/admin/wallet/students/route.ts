import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('[v0] Admin check:', { userId: user.id, isAdmin: profile?.is_admin })

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all students with their profiles
    const { data: profiles, error: profilesError } = await adminDb
      .from('profiles')
      .select('id, full_name, phone')
      .eq('is_admin', false)
      .order('full_name')

    console.log('[v0] Fetched profiles:', { count: profiles?.length, profilesError })

    if (profilesError) {
      console.error('[v0] Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch students', details: profilesError.message }, { status: 500 })
    }

    const students_list = profiles || []
    console.log('[v0] Total students found:', students_list.length)

    // Get all wallets
    const { data: wallets, error: walletsError } = await adminDb
      .from('student_wallets')
      .select('*')

    if (walletsError) {
      console.error('[v0] Error fetching wallets:', walletsError)
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
    }

    // Combine data
    const students = students_list.map(profile => {
      const wallet = (wallets || []).find(w => w.student_id === profile.id) || {
        student_id: profile.id,
        balance_cents: 0,
        total_credited_cents: 0,
        total_spent_cents: 0,
      }
      return { ...profile, wallet }
    })

    console.log('[v0] Returning students:', { count: students.length })
    return NextResponse.json({ students })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
