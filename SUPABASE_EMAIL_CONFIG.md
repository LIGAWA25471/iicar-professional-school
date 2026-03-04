# Supabase Email Configuration for Password Reset

## Required Supabase Auth Links Configuration

To enable password reset emails to work correctly and redirect users to your password update page, you need to add the following URL to Supabase:

### 1. **Password Reset Redirect URL**
Go to Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**

Add this URL:
```
https://iicar.org/auth/update-password
```

---

## Complete List of Redirect URLs for IICAR

Add ALL of these to your Supabase Redirect URLs list for full authentication flow support:

### Authentication Redirect URLs
```
https://iicar.org/auth/login
https://iicar.org/auth/register
https://iicar.org/auth/update-password
https://iicar.org/auth/reset-password
https://iicar.org/dashboard
```

### Development/Testing (Optional)
```
http://localhost:3000/auth/update-password
http://localhost:3000/dashboard
```

---

## How Password Reset Flow Works

1. **User initiates reset**: Visits `/auth/reset-password` and enters their email
2. **Supabase sends email**: Email is sent with a reset link that includes:
   - A special token in the URL: `type=recovery&token=...`
3. **User clicks link**: The link goes to `https://iicar.org/auth/update-password?type=recovery&token=...`
4. **Supabase Auth processes token**: The `createClient()` Supabase client automatically detects the recovery token in the URL
5. **User sets new password**: The `/auth/update-password` page calls `supabase.auth.updateUser({ password })` which uses the token automatically
6. **Redirect to dashboard**: After successful password update, user is redirected to `/dashboard`

---

## Email Template in Supabase

The password reset email is sent by Supabase with your configured redirect URL. Make sure:

1. Go to **Authentication** → **Email Templates**
2. Find **Reset Password** template
3. Verify it uses your configured redirect domain (should be automatic if you added the URL above)

---

## Testing the Flow

1. Go to `https://iicar.org/auth/reset-password`
2. Enter any account email
3. Check the email inbox for the password reset link
4. Click the link — it should take you to `https://iicar.org/auth/update-password?type=recovery&token=...`
5. Enter new password and confirm
6. Should redirect to `/dashboard` automatically

---

## Troubleshooting

### "Invalid redirect URL" error in Supabase
- Make sure you've added `https://iicar.org/auth/update-password` to Redirect URLs in Supabase Dashboard

### Email not received
- Check Supabase email service configuration
- Verify email template is enabled
- Check spam/junk folder

### Password update not working
- Clear browser cache/cookies
- Try incognito mode
- Check browser console for errors (F12 → Console)
