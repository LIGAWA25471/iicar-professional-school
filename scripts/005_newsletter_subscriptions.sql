-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "marketing": true,
    "promotions": true,
    "newPrograms": true
  }'::jsonb,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public subscription)
CREATE POLICY "Allow public to subscribe"
  ON public.newsletter_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin can view all subscriptions
CREATE POLICY "Allow authenticated users to view their own"
  ON public.newsletter_subscriptions
  FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM public.profiles WHERE is_admin = true LIMIT 1));

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx ON public.newsletter_subscriptions(email);

-- Create index for unsubscribed_at
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_unsubscribed_idx ON public.newsletter_subscriptions(unsubscribed_at);
