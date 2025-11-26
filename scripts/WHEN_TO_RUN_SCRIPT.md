# When to Run the Games Population Script

## Recommended Frequency

### For Price Updates:
- **Weekly** - Best balance between fresh prices and API usage
- **Bi-weekly** - If you don't need super current prices
- **Monthly** - Minimum recommended for price updates

### For New Games:
- **Monthly** - To add newly released games to your database
- **Quarterly** - If you only want major releases

## How the Script Works

The script is smart - it will:
- ✅ **Skip games updated in the last 7 days** - Won't re-fetch prices unnecessarily
- ✅ **Only update games that need updating** - Saves time and API calls
- ✅ **Add new games** - Games not in your database will be added

## Time Estimates

- **500 games**: ~50 minutes
- **1000 games**: ~100 minutes (1.5 hours)
- **2000 games**: ~200 minutes (3+ hours)

## Automation Options

### Option 1: Manual (Recommended for Start)
Run it manually when you want:
```bash
node scripts/populateGamesStandalone.mjs
```

### Option 2: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set to run weekly
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\Users\hnykw\gamerank\scripts\populateGamesStandalone.mjs`
7. Start in: `C:\Users\hnykw\gamerank`

### Option 3: Supabase Edge Function (Advanced)
Create a scheduled function in Supabase that runs the sync automatically.

## Best Practices

1. **Start with weekly runs** - See how it performs
2. **Run during off-peak hours** - Late night/weekends
3. **Monitor API usage** - Make sure you're not hitting rate limits
4. **Adjust frequency** - Based on how often prices change in your use case

## What Gets Updated

- ✅ **Prices** - Current prices from CheapShark
- ✅ **New games** - Games released since last run
- ⏭️ **Skipped** - Games updated in last 7 days (won't re-fetch)

## Signs You Should Run It

- Users reporting outdated prices
- New major game releases
- Big sales events (Steam sales, etc.)
- It's been more than a month since last run

