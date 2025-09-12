# Supabase Configuration Guide for OddsSightSeer

## 1. Upload Custom Email Templates

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Upload Templates
Upload these custom templates (located in `/supabase-email-templates/`):

1. **Confirm Signup Template**
   - File: `confirm-signup.html`
   - Template Type: "Confirm signup"
   - Subject: "Welcome to OddsSightSeer - Confirm Your Account 🎯"

2. **Magic Link Template**
   - File: `magic-link.html`
   - Template Type: "Magic Link"
   - Subject: "Your Secure OddsSightSeer Login Link 🔐"

3. **Password Recovery Template**
   - File: `password-recovery.html`
   - Template Type: "Recovery"
   - Subject: "Reset Your OddsSightSeer Password 🔑"

## 2. Fix Redirect URL Configuration

### Step 1: Update Site URL
In Supabase Dashboard → **Settings** → **General**:
- **Site URL**: `https://oddsightseer.com`

### Step 2: Update Redirect URLs
In Supabase Dashboard → **Authentication** → **URL Configuration**:

**Redirect URLs (add these):**
```
https://oddsightseer.com
https://oddsightseer.com/auth/callback
https://oddsightseer.com/login
https://oddsightseer.com/signup
https://www.oddsightseer.com
https://www.oddsightseer.com/auth/callback
```

**Remove localhost URLs from production:**
- Remove `http://localhost:3000` and variants

### Step 3: Update Environment Variables
Ensure your production environment has:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Email Template Features

### Custom Branding
- ✅ OddsSightSeer purple theme and branding
- ✅ Professional layout with gradient backgrounds
- ✅ Mobile-responsive design
- ✅ Security notices and expiration warnings

### Template Variables
The templates use Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The confirmation/magic link URL
- Custom styling matches your platform's purple theme

### Benefits Highlighted
- Real-time odds from 15+ sportsbooks
- Arbitrage detection and alerts
- Advanced analytics and line movement
- Premium tools and features

## 4. Testing

### Local Development
For local testing, temporarily add to Redirect URLs:
```
http://localhost:3000
http://localhost:3000/auth/callback
```

### Production Testing
1. Deploy your frontend to production
2. Test signup flow with real email
3. Verify emails use custom templates
4. Confirm redirects go to production domain

## 5. Troubleshooting

### Common Issues
1. **Still getting localhost redirects**: Clear Supabase redirect URL cache
2. **Email not using custom template**: Ensure template is saved and activated
3. **Redirect errors**: Check Site URL matches exactly (no trailing slash)

### Support
If issues persist, check Supabase logs in Dashboard → **Logs** → **Auth Logs**
