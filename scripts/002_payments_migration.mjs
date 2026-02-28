// Migration: add KopoKopo columns to payments table
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sql = `
  ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS phone_number        TEXT,
    ADD COLUMN IF NOT EXISTS kopokopo_location   TEXT,
    ADD COLUMN IF NOT EXISTS kopokopo_reference  TEXT,
    ADD COLUMN IF NOT EXISTS currency            TEXT NOT NULL DEFAULT 'KES';

  -- update existing rows that still have the old 'usd' default
  UPDATE public.payments SET currency = 'KES' WHERE currency = 'usd';
`

const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: null }))

// Supabase doesn't expose exec_sql; use direct REST approach via pg
// Instead, just verify the table is accessible
const { data, error: selectError } = await supabase
  .from('payments')
  .select('id')
  .limit(1)

if (selectError) {
  console.error('DB connection error:', selectError.message)
  process.exit(1)
}

console.log('DB connection OK. Please run this SQL in your Supabase SQL Editor:')
console.log('---')
console.log(sql.trim())
console.log('---')
console.log('Done.')
