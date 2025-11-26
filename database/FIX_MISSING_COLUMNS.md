# Fix Missing Columns in Games Table

You're getting errors because your `games` table is missing some columns. Here's how to fix it:

## Quick Fix

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New query"
4. Copy and paste the contents of `database/migration_add_missing_columns.sql`
5. Click "Run"

This will add all the missing columns (genre, image_url, rawg_id, released, rating, platforms, price_updated_at) to your existing games table.

## Alternative: Drop and Recreate

If you prefer to start fresh:

1. Go to Supabase Dashboard → **Table Editor**
2. Find the `games` table
3. Click the dropdown menu (three dots) → **Delete table**
4. Then run `database/migration_add_games_table.sql` to create the table with all columns

## Verify It Worked

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games'
ORDER BY ordinal_position;
```

You should see columns like: name, genre, image_url, price, rawg_id, released, rating, platforms, etc.

## Then Run the Script Again

Once the columns are added, run the populate script again:

```bash
node scripts/populateGamesStandalone.mjs
```

