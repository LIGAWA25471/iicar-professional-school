import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Upsert profile with all metadata captured during registration
      const meta = data.user.user_metadata ?? {}
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: meta.full_name ?? null,
        phone: meta.phone ?? null,
        country: meta.country ?? null,
        is_admin: false,
      }, { onConflict: 'id', ignoreDuplicates: false })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
