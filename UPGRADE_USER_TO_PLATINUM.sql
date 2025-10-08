-- Upgrade user to Platinum plan
-- User ID: e55b59d9-4b2d-42f5-8782-8edee416bc17

-- Update user plan to platinum
UPDATE users
SET 
  plan = 'platinum',
  updated_at = NOW()
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- Verify the update
SELECT 
  id,
  plan,
  api_request_count,
  grandfathered,
  created_at,
  updated_at
FROM users
WHERE id = 'e55b59d9-4b2d-42f5-8782-8edee416bc17';

-- Expected result:
-- plan should be 'platinum'
-- updated_at should be current timestamp
