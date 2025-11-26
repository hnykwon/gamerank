-- GameRank Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create game_rankings table
CREATE TABLE IF NOT EXISTS game_rankings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_name TEXT NOT NULL,
  genre TEXT,
  rating DECIMAL(5,2) NOT NULL,
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  date_added TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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
CREATE INDEX IF NOT EXISTS idx_game_rankings_user_id ON game_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rankings_rating ON game_rankings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_rankings_star_rating ON game_rankings(star_rating);
CREATE INDEX IF NOT EXISTS idx_game_rankings_is_public ON game_rankings(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for game_rankings
-- Users can read their own rankings
CREATE POLICY "Users can view own rankings"
  ON game_rankings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read public rankings
CREATE POLICY "Public rankings are viewable by everyone"
  ON game_rankings FOR SELECT
  USING (is_public = true);

-- Users can insert their own rankings
CREATE POLICY "Users can insert own rankings"
  ON game_rankings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rankings
CREATE POLICY "Users can update own rankings"
  ON game_rankings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own rankings
CREATE POLICY "Users can delete own rankings"
  ON game_rankings FOR DELETE
  USING (auth.uid() = user_id);

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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_game_rankings_updated_at
  BEFORE UPDATE ON game_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

