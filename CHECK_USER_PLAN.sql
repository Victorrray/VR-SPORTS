-- Check User Plan Status
-- Replace with your actual user ID

-- 1. Check user plan in users table
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered,
  created_at,
  updated_at
FROM users
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 2. Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 3. Check profile
SELECT 
  id,
  username,
  created_at,
  updated_at
FROM profiles
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- 4. If user doesn't exist in users table, create them with platinum
INSERT INTO users (id, plan, api_request_count, grandfathered, created_at, updated_at)
VALUES ('e55b59d9-4b2d-42f5-8782-8edee416bc17', 'platinum', 0, false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET plan = 'platinum', updated_at = NOW();

-- 5. Verify the update
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered
FROM users
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';
