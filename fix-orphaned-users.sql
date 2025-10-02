-- ============================================
-- FIX ORPHANED USERS - Create Missing Profiles
-- ============================================

-- First, let's see which users are missing profiles
SELECT 
  '🔍 ORPHANED USERS' as info,
  u.id,
  u.plan,
  u.grandfathered,
  u.created_at
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at;

-- Now create the missing profiles
INSERT INTO profiles (id, username, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1),
    'user_' || SUBSTRING(u.id::text, 1, 8)
  ) as username,
  u.created_at,
  NOW()
FROM users u
JOIN auth.users au ON u.id = au.id
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
  '✅ VERIFICATION' as status,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users now have profiles!'
    ELSE '⚠️ Still have orphaned users'
  END as result
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show final counts
SELECT 
  '📊 FINAL COUNTS' as info,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM profiles)
    THEN '✅ Counts match!'
    ELSE '❌ Counts do not match'
  END as status;
