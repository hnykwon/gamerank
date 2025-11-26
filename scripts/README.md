# Populate Games Database

This script populates your Supabase database with games (names, genres, images, and prices).

## Prerequisites

1. ✅ You've run the database migration (`database/migration_add_games_table.sql`)
2. ✅ Your Supabase credentials are configured in `src/config/supabase.js`

## How to Run

### Option 1: Using Node.js with ES Modules (Recommended)

```bash
node scripts/populateGames.mjs
```

### Option 2: If you get import errors, try:

```bash
node --experimental-modules scripts/populateGames.mjs
```

### Option 3: Using Babel (if installed)

```bash
npx babel-node scripts/populateGames.js
```

## What the Script Does

1. **Fetches games from RAWG.io API**
   - Gets game names, genres, images, ratings, release dates, platforms
   - Processes ~200 popular games

2. **Fetches prices from CheapShark API**
   - Gets current prices for each game
   - Finds the cheapest available price

3. **Stores everything in your database**
   - Upserts games (inserts new or updates existing)
   - Stores all metadata and prices
   - Tracks when prices were last updated

## Expected Output

```
🚀 Starting to populate games database...
⏳ This may take 10-20 minutes for 200 games...
📝 The script will:
   1. Fetch games from RAWG.io API (names, genres, images)
   2. Fetch prices from CheapShark API
   3. Store everything in your Supabase database

📊 Progress: 50/200 games (25%)
...
📊 Progress: 200/200 games (100%)

✅ === Sync Complete ===
📦 Total games processed: 200
✅ Successfully synced: 180
❌ Failed: 15
⏭️  Skipped (already up to date): 5

🎉 Your games database is now populated!
```

## Troubleshooting

### "Cannot find module" error
- Make sure you're in the project root directory
- Check that `src/services/gamePriceSyncService.js` exists

### "Supabase connection error"
- Verify your Supabase credentials in `src/config/supabase.js`
- Make sure you've run the database migration

### Script takes too long
- This is normal! It processes games in batches to avoid rate limiting
- Each game requires 1-2 API calls (RAWG + CheapShark)
- For 200 games, expect 10-20 minutes

### Some games show "Failed"
- Some games may not have prices available on CheapShark
- This is normal - those games will be stored without prices
- You can see "?" as the price category in the app

## After Running

1. Check your Supabase dashboard → Table Editor → `games` table
2. You should see games with names, genres, images, and prices
3. Your app will automatically use this data!

## Updating Prices

Run this script again periodically (weekly recommended) to update prices. The script will:
- Skip games updated in the last 7 days
- Only fetch prices for games that need updating
- Much faster on subsequent runs

