-- ============================================
-- SUPABASE USER QUERY DIAGNOSTIC CHECK
-- Run this in Supabase SQL Editor to verify user requests are working
-- ============================================

-- 1. CHECK USERS TABLE SCHEMA
-- Verify all required columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. CHECK FOR CONSTRAINT ISSUES
-- Look for any problematic constraints on the plan column
SELECT 
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'users'
ORDER BY constraint_name;

-- 3. CHECK PLAN COLUMN CONSTRAINTS
-- Specifically check the plan column for NOT NULL or CHECK constraints
SELECT 
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON con.conrelid = rel.oid
WHERE rel.relname = 'users'
AND con.contype IN ('c', 'f', 'p', 'u')
ORDER BY con.conname;

-- 4. TEST: Get single user by ID (simulating /api/me endpoint)
-- Replace 'YOUR_USER_ID' with actual user ID
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered,
  created_at,
  updated_at
FROM users
WHERE id = '936581d3-507b-4a25-9fce-2217f52a177c'
LIMIT 1;

-- 5. TEST: Get user with plan filter (simulating checkPlanAccess)
-- This tests if the query works with .eq() filter
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered
FROM users
WHERE id = '936581d3-507b-4a25-9fce-2217f52a177c'
AND (plan = 'platinum' OR plan = 'gold' OR grandfathered = true)
LIMIT 1;

-- 6. TEST: Insert new user (simulating getUserProfile creation)
-- This will fail if there are constraint issues
-- IMPORTANT: Uncomment to test, then ROLLBACK
-- BEGIN;
-- INSERT INTO users (id, plan, api_request_count, grandfathered, created_at, updated_at)
-- VALUES ('test-user-' || gen_random_uuid()::text, NULL, 0, false, NOW(), NOW())
-- RETURNING id, plan, api_request_count;
-- ROLLBACK;

-- 7. CHECK FOR EXISTING USERS
-- See what users exist and their plan status
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 8. CHECK PLAN DISTRIBUTION
-- See how many users have each plan
SELECT 
  plan,
  COUNT(*) as user_count
FROM users
GROUP BY plan
ORDER BY user_count DESC;

-- 9. CHECK FOR NULL PLAN VALUES
-- See if there are users with NULL plans (new users)
SELECT 
  COUNT(*) as null_plan_count,
  COUNT(CASE WHEN plan IS NOT NULL THEN 1 END) as non_null_plan_count
FROM users;

-- 10. CHECK TRIGGERS
-- Look for any triggers that might be interfering with user creation
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- 11. CHECK RLS POLICIES
-- Verify Row Level Security policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 12. TEST: Update user plan (simulating plan upgrade)
-- IMPORTANT: Uncomment to test with real user ID
-- UPDATE users 
-- SET plan = 'platinum', updated_at = NOW()
-- WHERE id = '936581d3-507b-4a25-9fce-2217f52a177c'
-- RETURNING id, plan, updated_at;

-- 13. CHECK PROFILES TABLE (if exists)
-- Some systems have separate profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 14. CHECK FOR FOREIGN KEY ISSUES
-- Look for any foreign key constraints that might block operations
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'users'
AND foreign_table_name IS NOT NULL;

-- 15. PERFORMANCE: Check for missing indexes
-- Look for indexes on frequently queried columns
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
-- 
-- If you see issues:
--
-- 1. PLAN COLUMN NOT NULL ERROR:
--    The plan column has a NOT NULL constraint but code tries to insert NULL
--    FIX: ALTER TABLE users ALTER COLUMN plan DROP NOT NULL;
--
-- 2. CHECK CONSTRAINT VIOLATION:
--    The plan column has a CHECK constraint limiting values
--    FIX: ALTER TABLE users DROP CONSTRAINT constraint_name;
--
-- 3. MISSING COLUMNS:
--    Required columns (api_request_count, grandfathered, etc.) don't exist
--    FIX: Run the database migration to add missing columns
--
-- 4. RLS POLICY ISSUES:
--    Row Level Security policies might be blocking queries
--    FIX: Check policies and ensure service role can bypass them
--
-- 5. TRIGGER ISSUES:
--    Triggers might be preventing inserts/updates
--    FIX: Review trigger logic or disable problematic triggers
--
-- ============================================
