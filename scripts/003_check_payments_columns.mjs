// Run this with: node scripts/003_run_payments_migration.mjs
// Adds KopoKopo columns to the payments table via Supabase REST API
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminDb = createClient(url, key, { auth: { persistSession: false } })

// Test columns exist by trying to select them
const { error: checkError } = await adminDb
  .from('payments')
  .select('id, phone_number, kopokopo_location, kopokopo_reference')
  .limit(1)

if (!checkError) {
  console.log('All KopoKopo columns already exist on payments table.')
  process.exit(0)
}

console.log('Column check error (expected if columns missing):', checkError.message)
console.log('')
console.log('Please run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):')
console.log('==========================================================================')
console.log(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS phone_number       TEXT;`)
console.log(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_location  TEXT;`)
console.log(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_reference TEXT;`)
console.log(`UPDATE public.payments SET currency = 'KES' WHERE currency = 'usd';`)
console.log('==========================================================================')
