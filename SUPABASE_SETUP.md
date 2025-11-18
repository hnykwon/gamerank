# Supabase Backend Setup Guide

This guide will help you set up Supabase as the backend for your GameRank app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or sign in if you already have one)
3. Click "New Project"
4. Fill in:
   - **Name**: GameRank (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Configure the App

1. Open `src/config/supabase.js`
2. Replace the placeholders:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Paste your Project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Paste your anon key
   ```

## Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the SQL from `database/schema.sql` (see below)
4. Click "Run" to execute the SQL

### Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_rankings_user_id ON game_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rankings_rating ON game_rankings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_rankings_star_rating ON game_rankings(star_rating);
CREATE INDEX IF NOT EXISTS idx_game_rankings_is_public ON game_rankings(is_public) WHERE is_public = true;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rankings ENABLE ROW LEVEL SECURITY;

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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
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
```

## Step 5: Test the Connection

1. Start your app: `npm start`
2. Try signing up with a new account
3. Try ranking a game
4. Check your Supabase dashboard → **Table Editor** to see if data is being saved

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the correct keys from Supabase
- Make sure there are no extra spaces in `supabase.js`

### "Row Level Security policy violation"
- Make sure you ran all the SQL policies in Step 4
- Check that RLS is enabled on both tables

### "relation does not exist"
- Make sure you ran the schema SQL in Step 4
- Check the Supabase SQL Editor for any errors

### Authentication not working
- Verify your Supabase URL and anon key are correct
- Check Supabase dashboard → **Authentication** → **Settings** for email settings

## Next Steps

- **Email Authentication**: Configure email templates in Supabase dashboard
- **Social Auth**: Add Google/GitHub login in Authentication settings
- **Storage**: Set up Supabase Storage for user avatars/game images
- **Real-time**: Already enabled! Rankings update in real-time across devices

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- Row Level Security (RLS) ensures users can only access their own data
- Never commit your `service_role` key to version control

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

