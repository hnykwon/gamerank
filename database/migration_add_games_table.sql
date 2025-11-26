-- Migration: Add games table to store complete game information
-- Stores game names, genres, images, and prices from RAWG.io API and CheapShark API
-- Run this in Supabase SQL Editor

-- Create games table with all game data
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  genre TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  rawg_id INTEGER,
  released DATE,
  rating DECIMAL(3,2),
  platforms TEXT[],
  price_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_price ON games(price);
CREATE INDEX IF NOT EXISTS idx_games_rawg_id ON games(rawg_id);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

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

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

