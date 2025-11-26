-- Migration: Add missing columns to games table
-- Run this if you already have a games table but it's missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns (only if they don't exist)
DO $$ 
BEGIN
  -- Add genre column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='genre') THEN
    ALTER TABLE games ADD COLUMN genre TEXT;
  END IF;

  -- Add image_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='image_url') THEN
    ALTER TABLE games ADD COLUMN image_url TEXT;
  END IF;

  -- Add rawg_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='rawg_id') THEN
    ALTER TABLE games ADD COLUMN rawg_id INTEGER;
  END IF;

  -- Add released column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='released') THEN
    ALTER TABLE games ADD COLUMN released DATE;
  END IF;

  -- Add rating column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='rating') THEN
    ALTER TABLE games ADD COLUMN rating DECIMAL(3,2);
  END IF;

  -- Add platforms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='platforms') THEN
    ALTER TABLE games ADD COLUMN platforms TEXT[];
  END IF;

  -- Add price_updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='games' AND column_name='price_updated_at') THEN
    ALTER TABLE games ADD COLUMN price_updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_rawg_id ON games(rawg_id);

