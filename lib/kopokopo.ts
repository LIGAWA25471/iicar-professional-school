// KopoKopo API helper — STK Push via /api/v1/incoming_payments
// Docs: https://api-docs.kopokopo.com/#receive-payments-from-m-pesa-users-via-stk-push
// Set KOPOKOPO_BASE_URL env var to switch between sandbox/production:
//   Sandbox:    https://sandbox.kopokopo.com  (default)
//   Production: https://app.kopokopo.com

const KOPOKOPO_BASE = (process.env.KOPOKOPO_BASE_URL ?? 'https://sandbox.kopokopo.com').replace(/\/$/, '')

const CLIENT_ID     = process.env.KOPOKOPO_CLIENT_ID!
const CLIENT_SECRET = process.env.KOPOKOPO_CLIENT_SECRET!
const TILL_NUMBER   = process.env.KOPOKOPO_TILL_NUMBER!

// Simple in-memory token cache (works fine in serverless with short-lived functions)
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type:    'client_credentials',
  })

  const res = await fetch(`${KOPOKOPO_BASE}/oauth/token`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':   'IICAR/1.0 NextJS',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`KopoKopo token error ${res.status}: ${text}`)
  }

  const data = await res.json()
  cachedToken    = data.access_token as string
  tokenExpiresAt = Date.now() + (data.expires_in as number) * 1000
  return cachedToken
}

export interface StkPushParams {
  firstName:   string
  lastName:    string
  phoneNumber: string   // E.164 e.g. "+254712345678"
  email?:      string
  amount:      number   // KES whole number
  currency?:   string
  callbackUrl: string
  metadata?:   Record<string, string>
}

export interface StkPushResult {
  location: string  // URL to poll for status e.g. https://sandbox.kopokopo.com/api/v1/incoming_payments/{id}
}

export async function initiateSTKPush(params: StkPushParams): Promise<StkPushResult> {
  const token = await getAccessToken()

  const body = {
    payment_channel: 'M-PESA STK Push',
    till_number:      TILL_NUMBER,
    subscriber: {
      first_name:   params.firstName,
      last_name:    params.lastName,
      phone_number: params.phoneNumber,
      ...(params.email ? { email: params.email } : {}),
    },
    amount: {
      currency: params.currency ?? 'KES',
      value:    params.amount,
    },
    metadata: params.metadata ?? {},
    _links: {
      callback_url: params.callbackUrl,
    },
  }

  const res = await fetch(`${KOPOKOPO_BASE}/api/v1/incoming_payments`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent':    'IICAR/1.0 NextJS',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`KopoKopo STK push error ${res.status}: ${text}`)
  }

  // On success KopoKopo returns 201 with Location header
  const location = res.headers.get('Location') ?? ''
  return { location }
}

export async function getSTKPushStatus(location: string): Promise<{
  status: string
  reference?: string
  amount?: number
}> {
  const token = await getAccessToken()

  const res = await fetch(location, {
    headers: {
      'Accept':        'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent':    'IICAR/1.0 NextJS',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`KopoKopo status check error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const resource = data?.data?.attributes ?? data?.data ?? {}
  return {
    status:    resource.status ?? 'Pending',
    reference: resource.reference,
    amount:    resource.amount?.value ?? resource.amount,
  }
}

