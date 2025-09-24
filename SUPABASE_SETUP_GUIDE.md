# Supabase Authentication Setup Guide

## Overview
This guide will help you set up real Supabase authentication to replace the demo mode and give each user their own account.

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign up/login
2. **Create a new project**:
   - Choose a project name (e.g., "VR-Odds")
   - Set a database password (save this!)
   - Choose a region close to your users
3. **Wait for project to be ready** (takes 2-3 minutes)

## Step 2: Get Your Credentials

1. **Go to Project Settings** → **API**
2. **Copy these values**:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

### For Local Development (.env file):
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your_anon_key
```

### For Production (Render Dashboard):
1. **Go to your Render dashboard**
2. **Select your frontend service**
3. **Go to Environment tab**
4. **Add these variables**:
   - `REACT_APP_SUPABASE_URL` = `https://your-project.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = `eyJ...your_anon_key`

### For Backend Server:
Add to your backend environment:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
```

## Step 4: Set Up Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table for additional user data
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create usage tracking table
CREATE TABLE public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  calls_made INTEGER DEFAULT 0,
  month_year TEXT, -- Format: "2024-01"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on api_usage table
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own usage
CREATE POLICY "Users can read own usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 5: Configure Authentication Settings

1. **Go to Authentication** → **Settings** in Supabase
2. **Site URL**: Set to your frontend URL (e.g., `https://odds-frontend-j2pn.onrender.com`)
3. **Redirect URLs**: Add your frontend URL
4. **Email Templates**: Customize if needed

## Step 6: Test Authentication

1. **Deploy your changes**
2. **Try signing up** with a new email
3. **Check Supabase dashboard** → **Authentication** → **Users** to see new users
4. **Verify** users start with 'free' plan (not automatic Platinum)

## Step 7: Update Your Deployment

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Enable real Supabase authentication, remove demo mode"
   git push
   ```

2. **Set environment variables** in Render dashboard
3. **Redeploy** your services

## What This Changes

### Before (Demo Mode):
- ❌ Everyone gets same user ID: `54276b6c-5255-4117-be95-70c22132591c`
- ❌ Everyone gets automatic Platinum access
- ❌ No real user accounts
- ❌ No usage tracking

### After (Real Authentication):
- ✅ Each user gets unique account
- ✅ Users start with 'free' plan (250 API calls/month)
- ✅ Real usage tracking per user
- ✅ Proper upgrade flow to Platinum
- ✅ Secure authentication with Supabase

## Troubleshooting

### "Authentication requires Supabase configuration" Error:
- Check environment variables are set correctly
- Verify Supabase URL starts with `https://`
- Verify anon key starts with `eyJ`

### Users Can't Sign Up:
- Check Site URL in Supabase settings
- Verify email confirmation is disabled (for testing)
- Check browser console for errors

### Need Help?
- Check Supabase docs: https://supabase.com/docs
- Verify environment variables in deployment platform
- Test locally first before deploying
