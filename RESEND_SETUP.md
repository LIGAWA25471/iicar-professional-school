# Resend Email Configuration Guide

## Setup Instructions

### 1. Create Resend Account
- Visit [resend.com](https://resend.com)
- Sign up or log in to your account
- Go to **API Keys** section

### 2. Get Your API Key
- Click "Create API Key"
- Copy the API key (starts with `re_`)

### 3. Add to Environment Variables
In your Vercel project:
1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste your API key from Resend
3. Click **Save** and **Redeploy**

### 4. Verify Sending Domain (Production)
For production emails, you need a verified domain:
1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter your domain: `iicar.org`
4. Add the CNAME records shown (through your domain registrar)
5. Once verified, update the sending email in code from `noreply@iicar.org`

For development, use the default Resend sandbox: `onboarding@resend.dev`

## Email Events Configured

### 1. **Enrollment Notification**
- **Trigger:** When admin enrolls a student with "already_paid" status
- **Content:** Welcome email with dashboard link
- **File:** `/app/api/admin/enroll/route.ts`

### 2. **Exam Completion Notification**
- **Trigger:** When student completes final exam
- **Content:** Score results and pass/fail status
- **File:** `/app/api/quiz/submit/route.ts`

### 3. **Certificate Notification**
- **Trigger:** When student passes final exam
- **Content:** Certificate achievement email with download link
- **File:** `/app/api/quiz/submit/route.ts`

## Email Templates

All templates are configured with:
- **From:** `noreply@iicar.org`
- **Branding:** IICAR colors and styling
- **Links:** Point to https://iicar.org

### Email Utility Functions
Located in `/lib/email/resend.ts`:
- `sendEnrollmentEmail()`
- `sendExamCompletionEmail()`
- `sendCertificateEmail()`

## Testing Emails

To test emails in development:
1. Use `onboarding@resend.dev` as the recipient email in tests
2. Check Resend dashboard → **Emails** to see sent emails
3. View email content and any delivery issues

## Troubleshooting

**Emails not sending:**
- Verify `RESEND_API_KEY` is set in environment variables
- Check that the API key is valid (not expired)
- For production, ensure domain is verified

**Wrong sender email:**
- Development: Uses `noreply@iicar.org` (must be verified domain)
- Solution: Use `onboarding@resend.dev` for testing

**Rate limits:**
- Resend free tier: 100 emails/day
- Upgrade plan for higher limits

## Production Checklist

- [ ] Verify domain in Resend
- [ ] Set `RESEND_API_KEY` in Vercel environment
- [ ] Test enrollment email flow
- [ ] Test exam completion email
- [ ] Test certificate email
- [ ] Update `noreply@iicar.org` to your verified sender email
