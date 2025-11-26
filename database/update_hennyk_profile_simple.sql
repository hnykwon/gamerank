-- Simple script to update hennyk user profile
-- Run this in Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update any user with username containing 'henny' (case insensitive)
UPDATE profiles
SET 
  first_name = 'Henry',
  last_name = 'Kwon',
  updated_at = TIMEZONE('utc'::text, NOW())
WHERE LOWER(username) LIKE '%henny%';

-- Show the result
SELECT username, first_name, last_name 
FROM profiles 
WHERE LOWER(username) LIKE '%henny%';


