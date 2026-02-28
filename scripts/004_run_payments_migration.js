// Runs the payments migration via Supabase SQL API
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = new URL(url).hostname.split('.')[0]
const sqlApiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec`

// Use the pg REST endpoint for DDL
const migrationSql = `
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS phone_number       TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_location  TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_reference TEXT;
UPDATE public.payments SET currency = 'KES' WHERE currency = 'usd';
`

// Supabase doesn't expose raw SQL via REST for DDL. 
// We use the management API instead.
const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

const res = await fetch(managementUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: JSON.stringify({ query: migrationSql }),
})

if (res.ok) {
  const data = await res.json()
  console.log('Migration successful:', JSON.stringify(data))
} else {
  const text = await res.text()
  console.log(`Management API response (${res.status}):`, text)
  console.log('')
  console.log('If the above failed, please run this SQL manually in Supabase SQL Editor:')
  console.log(migrationSql)
}
