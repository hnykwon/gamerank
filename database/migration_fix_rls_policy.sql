-- Migration: Fix RLS policies for games table to allow inserts
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can update games" ON games;
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;

-- RLS Policy: Everyone can read games (public data)
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- RLS Policy: Everyone can insert games (public data)
CREATE POLICY "Anyone can insert games"
  ON games FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Everyone can update games (public data)
CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE
  USING (true)
  WITH CHECK (true);

