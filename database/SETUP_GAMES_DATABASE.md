# Setup Games Database - Complete Guide

This guide will walk you through creating a complete games database with names, genres, images, and prices.

## Step 1: Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New query"
4. Copy and paste the contents of `database/migration_add_games_table.sql`
5. Click "Run" to execute the SQL

This creates the `games` table with columns for:
- `name` - Game name (unique)
- `genre` - Game genre
- `image_url` - Game cover image URL
- `price` - Game price in USD
- `rawg_id` - RAWG.io game ID
- `released` - Release date
- `rating` - Game rating
- `platforms` - Available platforms
- `price_updated_at` - When price was last fetched

## Step 2: Populate the Database

You have two options to populate the database:

### Option A: Use the Sync Service (Recommended)

The sync service will:
1. Fetch games from RAWG.io API (gets names, genres, images, metadata)
2. Fetch prices from CheapShark API for each game
3. Store everything in your database

**Create a script file** (e.g., `scripts/populateGames.js`):

```javascript
import { syncAllGamePrices } from '../src/services/gamePriceSyncService';

console.log('Starting to populate games database...');
console.log('This may take 10-20 minutes for 200 games...');

syncAllGamePrices((current, total) => {
  const percentage = Math.round((current / total) * 100);
  console.log(`Progress: ${current}/${total} games (${percentage}%)`);
}).then(result => {
  console.log('\n=== Sync Complete ===');
  console.log(`Total games: ${result.total}`);
  console.log(`Successfully synced: ${result.successCount}`);
  console.log(`Failed: ${result.failCount}`);
  console.log(`Skipped (already up to date): ${result.skippedCount}`);
}).catch(error => {
  console.error('Error during sync:', error);
});
```

**Run the script:**
```bash
node scripts/populateGames.js
```

### Option B: Manual Population via Supabase Dashboard

1. Go to Supabase Dashboard → **Table Editor**
2. Select the `games` table
3. Click "Insert row" and manually add games
4. Fill in: name, genre, image_url, price, etc.

## Step 3: Update Prices Periodically

Game prices change over time. You should update them periodically:

**Recommended:** Run the sync service weekly to update prices

You can:
- Set up a cron job
- Create a Supabase Edge Function
- Run it manually when needed

The sync service is smart - it will:
- Skip games updated within the last 7 days
- Only fetch prices for games that need updating
- Handle rate limiting automatically

## Step 4: Use the Database in Your App

Once populated, your app will automatically:
- Fetch game metadata (name, genre, images) from the database
- Display prices from the database
- Show price categories ($, $$, $$$, $$$$)

The `DiscoverScreen` is already configured to use the database!

## Troubleshooting

### No prices showing?
- Make sure you've run the sync service at least once
- Check that the `games` table has data: `SELECT * FROM games LIMIT 10;`
- Verify prices were fetched: `SELECT name, price FROM games WHERE price IS NOT NULL LIMIT 10;`

### Prices not updating?
- The sync service skips games updated in the last 7 days
- To force update, you can manually delete `price_updated_at` or run: `UPDATE games SET price_updated_at = NULL;`

### API Rate Limits?
- The sync service includes delays between batches
- If you hit rate limits, wait a few minutes and try again
- Consider running the sync during off-peak hours

## Database Schema

```sql
games
├── id (BIGSERIAL PRIMARY KEY)
├── name (TEXT UNIQUE NOT NULL)
├── genre (TEXT)
├── image_url (TEXT)
├── price (DECIMAL(10,2))
├── rawg_id (INTEGER)
├── released (DATE)
├── rating (DECIMAL(3,2))
├── platforms (TEXT[])
├── price_updated_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Next Steps

1. ✅ Run the migration
2. ✅ Populate the database using the sync service
3. ✅ Verify data in Supabase dashboard
4. ✅ Test in your app - prices should now appear!

