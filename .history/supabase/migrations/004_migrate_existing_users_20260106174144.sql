-- =====================================================
-- Migration Script: Migrate Existing Users to Profiles
-- =====================================================
-- This script migrates all existing users from auth.users 
-- to the profiles table
-- 
-- Run this AFTER creating the profiles table (003_create_profiles_table.sql)
-- =====================================================

-- Step 1: Insert existing users into profiles table
-- Only insert users that don't already have a profile
INSERT INTO public.profiles (user_id, email, username, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  -- Extract username from metadata if available
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'name',
    NULL
  ) as username,
  -- Extract role from metadata, default to 'admin'
  COALESCE(
    au.raw_user_meta_data->>'role',
    'admin'
  ) as role,
  -- Use original created_at from auth.users
  au.created_at,
  -- Set updated_at to current time
  NOW() as updated_at
FROM auth.users au
WHERE 
  -- Only migrate users with email
  au.email IS NOT NULL
  -- Skip users that already have a profile
  AND NOT EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.user_id = au.id
  );

-- Step 2: Update existing profiles with missing data from auth.users
-- This handles cases where profile was created but missing username
UPDATE public.profiles p
SET 
  username = COALESCE(
    p.username,
    (SELECT 
      COALESCE(
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'name'
      )
     FROM auth.users au 
     WHERE au.id = p.user_id
    )
  ),
  -- Update email if it changed in auth.users
  email = COALESCE(
    (SELECT au.email FROM auth.users au WHERE au.id = p.user_id),
    p.email
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM auth.users au 
  WHERE au.id = p.user_id
);

-- Step 3: Display migration summary
DO $$
DECLARE
  migrated_count INTEGER;
  total_users INTEGER;
  total_profiles INTEGER;
  users_without_profiles INTEGER;
BEGIN
  -- Count total users in auth.users
  SELECT COUNT(*) INTO total_users 
  FROM auth.users 
  WHERE email IS NOT NULL;
  
  -- Count total profiles
  SELECT COUNT(*) INTO total_profiles 
  FROM public.profiles;
  
  -- Count users without profiles
  SELECT COUNT(*) INTO users_without_profiles
  FROM auth.users au
  WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
  );
  
  -- Calculate how many were migrated (difference between users and profiles)
  migrated_count := total_users - users_without_profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users in auth.users: %', total_users;
  RAISE NOTICE 'Total profiles in profiles table: %', total_profiles;
  RAISE NOTICE 'Users without profiles: %', users_without_profiles;
  RAISE NOTICE 'Users with profiles: %', migrated_count;
  RAISE NOTICE '========================================';
  
  IF users_without_profiles = 0 THEN
    RAISE NOTICE '✓ All users have been migrated successfully!';
  ELSE
    RAISE NOTICE '⚠ Warning: % users still need profiles. Run migration again.', users_without_profiles;
  END IF;
END $$;

-- Step 4: Verify migration (optional - shows sample of migrated data)
-- Uncomment the following to see a sample of migrated profiles:
/*
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.email,
  p.role,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;
*/

