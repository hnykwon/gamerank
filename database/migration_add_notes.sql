-- Migration: Add notes column to game_rankings table
-- Run this in Supabase SQL Editor

ALTER TABLE game_rankings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to the column
COMMENT ON COLUMN game_rankings.notes IS 'User notes/thoughts about the game ranking';

