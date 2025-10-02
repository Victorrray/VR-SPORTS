-- ============================================
-- SUPABASE DATABASE AUDIT SCRIPT
-- Run this in Supabase SQL Editor to verify everything is set up correctly
-- ============================================

-- ============================================
-- 1. CHECK TABLES EXIST
-- ============================================
SELECT 
  '📋 TABLES CHECK' as audit_section,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing tables'
  END as status,
  COUNT(*) as tables_found,
  STRING_AGG(tablename, ', ') as table_names
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'profiles');

-- ============================================
-- 2. CHECK USERS TABLE STRUCTURE
-- ============================================
SELECT 
  '🔍 USERS TABLE COLUMNS' as audit_section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK PROFILES TABLE STRUCTURE
-- ============================================
SELECT 
  '🔍 PROFILES TABLE COLUMNS' as audit_section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 4. CHECK REQUIRED COLUMNS IN USERS TABLE
-- ============================================
SELECT 
  '✅ USERS REQUIRED COLUMNS' as audit_section,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing required columns'
  END as status,
  STRING_AGG(column_name, ', ') as found_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'plan', 'api_request_count', 'grandfathered');

-- ============================================
-- 5. CHECK PLAN CONSTRAINT (Should allow NULL)
-- ============================================
SELECT 
  '🔒 PLAN CONSTRAINT CHECK' as audit_section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition,
  CASE 
    WHEN pg_get_constraintdef(oid) LIKE '%IS NOT NULL%' THEN '❌ FAIL - Plan constraint too restrictive'
    ELSE '✅ PASS - Plan can be NULL'
  END as status
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname LIKE '%plan%';

-- ============================================
-- 6. CHECK RLS (Row Level Security) STATUS
-- ============================================
SELECT 
  '🔐 RLS STATUS' as audit_section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '⚠️ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'profiles');

-- ============================================
-- 7. CHECK RLS POLICIES
-- ============================================
SELECT 
  '📜 RLS POLICIES' as audit_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'profiles')
ORDER BY tablename, policyname;

-- ============================================
-- 8. CHECK TRIGGERS
-- ============================================
SELECT 
  '⚡ TRIGGERS' as audit_section,
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_statement as function_called,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('users', 'profiles')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9. CHECK FUNCTIONS
-- ============================================
SELECT 
  '🔧 FUNCTIONS' as audit_section,
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- ============================================
-- 10. CHECK USER DATA SUMMARY
-- ============================================
SELECT 
  '👥 USER DATA SUMMARY' as audit_section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN plan = 'platinum' THEN 1 END) as platinum_users,
  COUNT(CASE WHEN plan = 'gold' THEN 1 END) as gold_users,
  COUNT(CASE WHEN plan IS NULL THEN 1 END) as no_plan_users,
  COUNT(CASE WHEN grandfathered = TRUE THEN 1 END) as grandfathered_users,
  SUM(api_request_count) as total_api_calls
FROM users;

-- ============================================
-- 11. CHECK PROFILES DATA SUMMARY
-- ============================================
SELECT 
  '📝 PROFILES DATA SUMMARY' as audit_section,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as profiles_with_username
FROM profiles;

-- ============================================
-- 12. CHECK FOR ORPHANED RECORDS
-- ============================================
-- Users without profiles
SELECT 
  '🔍 ORPHANED USERS (no profile)' as audit_section,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - No orphaned users'
    ELSE '⚠️ WARNING - Some users missing profiles'
  END as status
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Profiles without users
SELECT 
  '🔍 ORPHANED PROFILES (no user)' as audit_section,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - No orphaned profiles'
    ELSE '⚠️ WARNING - Some profiles missing users'
  END as status
FROM profiles p
LEFT JOIN users u ON p.id = u.id
WHERE u.id IS NULL;

-- ============================================
-- 13. CHECK INDEXES
-- ============================================
SELECT 
  '📊 INDEXES' as audit_section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'profiles')
ORDER BY tablename, indexname;

-- ============================================
-- 14. SAMPLE USER DATA (First 5 users)
-- ============================================
SELECT 
  '📋 SAMPLE USERS' as audit_section,
  id,
  plan,
  grandfathered,
  api_request_count,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 15. FINAL AUDIT SUMMARY
-- ============================================
WITH audit_checks AS (
  SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'profiles')) >= 2 as tables_exist,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('id', 'plan', 'api_request_count', 'grandfathered')) >= 4 as required_columns_exist,
    (SELECT COUNT(*) FROM users) > 0 as has_users,
    (SELECT COUNT(*) FROM profiles) > 0 as has_profiles,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'profiles')) > 0 as has_rls_policies
)
SELECT 
  '🎯 FINAL AUDIT SUMMARY' as audit_section,
  CASE WHEN tables_exist THEN '✅' ELSE '❌' END as tables,
  CASE WHEN required_columns_exist THEN '✅' ELSE '❌' END as columns,
  CASE WHEN has_users THEN '✅' ELSE '⚠️' END as users_data,
  CASE WHEN has_profiles THEN '✅' ELSE '⚠️' END as profiles_data,
  CASE WHEN has_rls_policies THEN '✅' ELSE '⚠️' END as rls_policies,
  CASE 
    WHEN tables_exist AND required_columns_exist THEN '✅ DATABASE READY'
    ELSE '❌ DATABASE NEEDS SETUP'
  END as overall_status
FROM audit_checks;

-- ============================================
-- 16. RECOMMENDATIONS
-- ============================================
SELECT 
  '💡 RECOMMENDATIONS' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM users WHERE plan IS NULL) > 0 
    THEN 'Consider setting default plans for users with NULL plan'
    WHEN (SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) > 0
    THEN 'Fix orphaned users without profiles'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') = 0
    THEN 'Add RLS policies to users table for security'
    ELSE 'Database looks good! ✅'
  END as recommendation;
