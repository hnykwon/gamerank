# Populate Game Prices in Database

This guide explains how to populate the games table with prices from the CheapShark API.

## Step 1: Run the Migration

First, you need to create the `games` table in your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `database/migration_add_games_table.sql`

This will create the `games` table with the necessary structure.

## Step 2: Populate Prices

You can populate prices in two ways:

### Option A: Using the Sync Service (Recommended)

Create a simple script or add a function to your app that calls the sync service:

```javascript
import { syncAllGamePrices } from './src/services/gamePriceSyncService';

// This will fetch prices for all games and store them in the database
syncAllGamePrices((current, total) => {
  console.log(`Progress: ${current}/${total} games processed`);
}).then(result => {
  console.log('Sync complete:', result);
});
```

### Option B: Manual Sync via Supabase Functions

You can create a Supabase Edge Function or scheduled job to run the sync periodically.

## Step 3: Update Prices Periodically

Prices should be updated periodically (e.g., weekly) to keep them current. The sync service will:
- Skip games that were updated within the last 7 days
- Fetch new prices for games that need updating
- Handle rate limiting with delays between batches

## Notes

- The sync process may take a while (10-20 minutes for 200 games) due to API rate limits
- Prices are cached in the database to avoid repeated API calls
- Games without prices will show "?" in the price category display

