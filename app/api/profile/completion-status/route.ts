import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, country, terms_accepted, profile_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[v0] Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if profile is complete
    const isPhoneSet = !!profile?.phone && profile.phone.trim().length > 0
    const isCountrySet = !!profile?.country && profile.country.trim().length > 0
    const isTermsAccepted = profile?.terms_accepted === true

    const profileComplete = isPhoneSet && isCountrySet
    const canProceed = profileComplete && isTermsAccepted

    console.log('[v0] Profile completion check:', {
      userId: user.id,
      phoneSet: isPhoneSet,
      countrySet: isCountrySet,
      termsAccepted: isTermsAccepted,
      profileComplete,
      canProceed,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        full_name: profile?.full_name,
        phone: profile?.phone,
        country: profile?.country,
      },
      completion: {
        phoneSet: isPhoneSet,
        countrySet: isCountrySet,
        termsAccepted: isTermsAccepted,
        profileComplete,
        canProceed,
      },
    })
  } catch (error) {
    console.error('[v0] Completion status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
