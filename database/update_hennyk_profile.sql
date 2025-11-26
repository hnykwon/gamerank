-- Update existing user profile with first name and last name
-- Run this in Supabase SQL Editor
-- Note: This will bypass RLS policies when run as admin in SQL Editor

-- Step 1: First, ensure the columns exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Check what the actual username is (uncomment to see all users with similar names)
-- SELECT id, username, email, first_name, last_name FROM profiles WHERE username ILIKE '%henny%' OR username ILIKE '%henry%';

-- Step 3: Update the profile (adjust username if needed - case sensitive!)
-- Replace 'hennyk' with the exact username from the query above
UPDATE profiles
SET 
  first_name = 'Henry',
  last_name = 'Kwon',
  updated_at = TIMEZONE('utc'::text, NOW())
WHERE username = 'hennyk';

-- If the username has different casing, try one of these instead:
-- WHERE LOWER(username) = 'hennyk';
-- WHERE username ILIKE 'hennyk%';

-- Step 4: Verify the update worked
SELECT id, username, email, first_name, last_name, updated_at
FROM profiles 
WHERE username = 'hennyk';

