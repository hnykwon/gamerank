-- Migration: Add follows table for follower/following feature
-- Run this in Supabase SQL Editor if you already have the base schema set up

-- Create follows table for follower/following relationships
CREATE TABLE IF NOT EXISTS follows (
  id BIGSERIAL PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Enable Row Level Security (RLS)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
-- Users can view their own follows (both following and followers)
CREATE POLICY "Users can view own follows"
  ON follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow other users
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Users can view rankings from users they follow
CREATE POLICY "Users can view followed users' rankings"
  ON game_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.follower_id = auth.uid()
      AND follows.following_id = game_rankings.user_id
    )
  );

