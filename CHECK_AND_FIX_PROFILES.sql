-- Check and Fix Profiles Table for Username Setup

-- 1. Check if profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 2. Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if user has a profile row
-- Replace 'USER_ID_HERE' with actual user ID
SELECT * FROM profiles WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 4. If profile doesn't exist, create it
-- This should be done automatically by the trigger, but just in case:
INSERT INTO profiles (id, username, created_at, updated_at)
VALUES ('e55b59d9-4b2d-42f5-8782-8edee416bc17', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Test username update
UPDATE profiles
SET username = 'Randy', updated_at = NOW()
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 6. Verify the update
SELECT id, username, created_at, updated_at
FROM profiles
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 7. Check for username constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- 8. Check for username validation function
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%username%';
