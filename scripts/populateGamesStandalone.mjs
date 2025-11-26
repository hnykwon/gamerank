// Standalone script to populate games database
// This version doesn't rely on React Native modules
// Run with: node scripts/populateGamesStandalone.mjs

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - update these with your credentials
const SUPABASE_URL = 'https://bjviktxcpsolyawrauvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdmlrdHhjcHNvbHlhd3JhdXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTU0MDIsImV4cCI6MjA3ODk5MTQwMn0.QskYqQF-K2qranEM9L5XbL31LmGBv_8F_w6FMZchp6o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RAWG_API_KEY = 'd2b865c2d8ea46bda24975b72b12fb90';

// Fetch games from RAWG.io with pagination
async function fetchGamesFromRAWG(maxGames = 200) {
  try {
    const allGames = [];
    const pageSize = 40; // RAWG API max per page
    let page = 1;
    let hasMore = true;
    
    console.log(`📥 Fetching games from RAWG.io (target: ${maxGames} games)...`);
    
    while (hasMore && allGames.length < maxGames) {
      // Include stores in the response to get Steam App IDs
      const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${page}&page_size=${pageSize}&ordering=-rating&metacritic=70,100`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`RAWG API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const games = data.results.map(game => {
          // Extract Steam App ID from stores array if available
          let steamAppId = null;
          if (game.stores && Array.isArray(game.stores)) {
            const steamStore = game.stores.find(s => s.store && s.store.slug === 'steam');
            if (steamStore && steamStore.store_id) {
              // Steam store_id in RAWG is the Steam App ID
              steamAppId = steamStore.store_id.toString();
            }
          }
          
          return {
            id: game.id,
            name: game.name,
            genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Unknown',
            imageUrl: game.background_image || null,
            rating: game.rating || 0,
            released: game.released,
            platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
            steamAppId: steamAppId,
          };
        });
        
        allGames.push(...games);
        console.log(`   Fetched page ${page}: ${games.length} games (total: ${allGames.length})`);
        
        // Check if there are more pages
        hasMore = data.next !== null && allGames.length < maxGames;
        page++;
        
        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ Total games fetched: ${allGames.length}\n`);
    return allGames;
  } catch (error) {
    console.error('Error fetching games from RAWG:', error);
    return [];
  }
}

// Helper to clean game name for better matching
function cleanGameName(name) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove text in parentheses like "(2018)", "(Remastered)"
    .replace(/\s*:\s*/g, ' ') // Replace colons with spaces
    .replace(/\s*–\s*/g, ' ') // Replace em dashes
    .replace(/\s*-\s*/g, ' ') // Replace hyphens
    .trim()
    .toLowerCase();
}

// Helper to check if game names match (fuzzy matching)
function gameNamesMatch(name1, name2) {
  const clean1 = cleanGameName(name1);
  const clean2 = cleanGameName(name2);
  
  // Exact match
  if (clean1 === clean2) return true;
  
  // Check if one contains the other (for partial matches)
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    const minLength = Math.min(clean1.length, clean2.length);
    return minLength >= 5; // At least 5 characters for a valid match
  }
  
  return false;
}

// Fetch price from CheapShark
// Can use either gameName (for search) or steamAppId (direct lookup - more efficient)
async function fetchCheapSharkPrice(gameName, steamAppId = null) {
  try {
    // Add delay to avoid rate limiting (CheapShark has strict limits)
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between requests
    
    let deals = [];
    
    // OPTIMIZATION: If we have Steam App ID, use it directly (more efficient)
    if (steamAppId) {
      const dealsUrl = `https://www.cheapshark.com/api/1.0/deals?steamAppID=${steamAppId}`;
      const dealsResponse = await fetch(dealsUrl);
      
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        
        // Check for rate limiting error
        if (dealsData && dealsData.error) {
          if (dealsData.error.includes('rate limiting') || dealsData.error.includes('rate limit')) {
            console.warn(`  ⚠️  CheapShark rate limited (Steam ID) for ${gameName}`);
            return null;
          }
          console.warn(`  ⚠️  CheapShark error (Steam ID) for ${gameName}: ${dealsData.error}`);
          return null;
        }
        
        // Handle response format (can be array or object)
        if (Array.isArray(dealsData)) {
          deals = dealsData;
        } else if (dealsData && Array.isArray(dealsData.deals)) {
          deals = dealsData.deals;
        } else if (dealsData && typeof dealsData === 'object') {
          // Single deal object
          deals = [dealsData];
        }
        
        // If we got deals from Steam ID, use them
        if (deals && deals.length > 0) {
          let lowestPrice = Infinity;
          deals.forEach(deal => {
            // Check multiple price fields (API uses different fields)
            const price = parseFloat(
              deal.price || 
              deal.salePrice || 
              deal.finalPrice || 
              0
            );
            if (price > 0 && price < lowestPrice) {
              lowestPrice = price;
            }
          });
          
          if (lowestPrice !== Infinity) {
            return lowestPrice;
          }
        }
      }
    }
    
    // FALLBACK: Search by game name if Steam ID didn't work or wasn't available
    // Try exact name first
    let searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameName)}&limit=10`;
    let response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.warn(`  ⚠️  CheapShark HTTP error for ${gameName}: ${response.status}`);
      return null;
    }
    
    let data = await response.json();
    
    // Check for rate limiting error in response
    if (data && data.error) {
      if (data.error.includes('rate limiting') || data.error.includes('rate limit')) {
        console.warn(`  ⚠️  CheapShark rate limited for ${gameName}. Waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        return null;
      }
      console.warn(`  ⚠️  CheapShark error for ${gameName}: ${data.error}`);
      return null;
    }
    
    // Verify data is an array
    if (!Array.isArray(data)) {
      console.warn(`  ⚠️  CheapShark returned unexpected format for ${gameName}`);
      return null;
    }
    
    // If no results, try without parentheses content (e.g., "Game (2023)" -> "Game")
    if (data.length === 0) {
      const nameWithoutParentheses = gameName.replace(/\s*\([^)]*\)\s*/g, '').trim();
      if (nameWithoutParentheses !== gameName && nameWithoutParentheses.length > 0) {
        searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(nameWithoutParentheses)}&limit=10`;
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay for second request
        response = await fetch(searchUrl);
        if (response.ok) {
          data = await response.json();
          // Check for rate limiting in second response too
          if (data && data.error) {
            if (data.error.includes('rate limiting') || data.error.includes('rate limit')) {
              console.warn(`  ⚠️  CheapShark rate limited (retry) for ${gameName}`);
              return null;
            }
          }
          // Verify it's still an array
          if (!Array.isArray(data)) {
            return null;
          }
        }
      }
    }
    
    if (data && data.length > 0) {
      // Try to find best match using fuzzy matching
      let bestMatch = data.find(game => 
        gameNamesMatch(game.external, gameName)
      );
      
      // If no fuzzy match, try exact match
      if (!bestMatch) {
        bestMatch = data.find(game => 
          game.external.toLowerCase() === gameName.toLowerCase()
        );
      }
      
      // If still no match, use the first result
      if (!bestMatch) {
        bestMatch = data[0];
      }
      
      // Verify we have a gameID
      if (!bestMatch || !bestMatch.gameID) {
        console.warn(`  ⚠️  No gameID found for ${gameName}`);
        return null;
      }
      
      const gameId = bestMatch.gameID;
      const dealsUrl = `https://www.cheapshark.com/api/1.0/deals?gameID=${gameId}`;
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay before deals request
      const dealsResponse = await fetch(dealsUrl);
      
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        
        // Check for rate limiting in deals response
        if (dealsData && dealsData.error) {
          if (dealsData.error.includes('rate limiting') || dealsData.error.includes('rate limit')) {
            console.warn(`  ⚠️  CheapShark rate limited (deals) for ${gameName}`);
            return null;
          }
        }
        
        // Handle response format
        if (Array.isArray(dealsData)) {
          deals = dealsData;
        } else if (dealsData && Array.isArray(dealsData.deals)) {
          deals = dealsData.deals;
        } else if (dealsData && typeof dealsData === 'object') {
          deals = [dealsData];
        }
        
        if (deals && deals.length > 0) {
          let lowestPrice = Infinity;
          deals.forEach(deal => {
            // Check multiple price fields (API documentation shows different fields)
            const price = parseFloat(
              deal.price || 
              deal.salePrice || 
              deal.finalPrice ||
              0
            );
            if (price > 0 && price < lowestPrice) {
              lowestPrice = price;
            }
          });
          
          return lowestPrice !== Infinity ? lowestPrice : null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`  ⚠️  CheapShark exception for ${gameName}:`, error.message);
    return null;
  }
}

// Fetch price from Steam API
async function fetchSteamPrice(steamAppId) {
  if (!steamAppId) return null;
  
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
    
    const url = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=US`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`  ⚠️  Steam API HTTP error for App ID ${steamAppId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const appData = data[steamAppId];
    
    if (appData && appData.success && appData.data) {
      const priceData = appData.data.price_overview;
      if (priceData && priceData.final) {
        // Convert cents to dollars
        return (priceData.final / 100);
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`  ⚠️  Steam API exception for App ID ${steamAppId}:`, error.message);
    return null;
  }
}

// Multi-source price fetcher: tries CheapShark first, then Steam
async function fetchGamePrice(gameName, steamAppId = null) {
  // 1. Try CheapShark first (covers multiple stores)
  // Pass steamAppId to CheapShark for more efficient lookup
  const cheapSharkPrice = await fetchCheapSharkPrice(gameName, steamAppId);
  if (cheapSharkPrice) {
    return { price: cheapSharkPrice, source: 'cheapshark' };
  }
  
  // 2. Try Steam API if we have a Steam App ID
  if (steamAppId) {
    const steamPrice = await fetchSteamPrice(steamAppId);
    if (steamPrice) {
      return { price: steamPrice, source: 'steam' };
    }
  }
  
  // 3. No price found
  return { price: null, source: null };
}

// Upsert game to database
async function upsertGame(game) {
  try {
    const { data, error } = await supabase
      .from('games')
      .upsert({
        name: game.name,
        genre: game.genre || null,
        image_url: game.imageUrl || null,
        price: game.price || null,
        rawg_id: game.id || null,
        released: game.released || null,
        rating: game.rating || null,
        platforms: game.platforms || null,
        price_updated_at: game.price ? new Date().toISOString() : null,
      }, {
        onConflict: 'name',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error(`Error upserting game ${game.name}:`, error);
    return { success: false, error };
  }
}

// Main sync function
async function syncAllGamePrices(onProgress = null, maxGames = 200) {
  try {
    console.log('🚀 Fetching games from RAWG.io...');
    const games = await fetchGamesFromRAWG(maxGames);
    console.log(`✅ Found ${games.length} games\n`);
    
    let successCount = 0;
    let noPriceCount = 0; // Games saved but no price found
    let errorCount = 0; // Games that failed to save
    let skippedCount = 0;
    let cheapSharkCount = 0; // Prices from CheapShark
    let steamCount = 0; // Prices from Steam
    const batchSize = 5; // Reduced batch size to avoid rate limiting
    const delayBetweenBatches = 2000; // Increased delay to 2 seconds between batches

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      
      const promises = batch.map(async (game) => {
        try {
          // Check if game exists and was updated recently
          const { data: existingGame } = await supabase
            .from('games')
            .select('price_updated_at, price')
            .eq('name', game.name)
            .single();
          
          if (existingGame && existingGame.price_updated_at) {
            const lastUpdate = new Date(existingGame.price_updated_at);
            const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 7 && existingGame.price) {
              skippedCount++;
              return { success: true, skipped: true, game: game.name };
            }
          }

          // If we don't have a Steam App ID yet, try to fetch it from RAWG detailed endpoint
          if (!game.steamAppId) {
            try {
              const detailUrl = `https://api.rawg.io/api/games/${game.id}?key=${RAWG_API_KEY}`;
              const detailResponse = await fetch(detailUrl);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.stores && Array.isArray(detailData.stores)) {
                  const steamStore = detailData.stores.find(s => s.store && s.store.slug === 'steam');
                  if (steamStore && steamStore.store_id) {
                    game.steamAppId = steamStore.store_id.toString();
                  }
                }
              }
            } catch (error) {
              // Silently fail - we'll just try without Steam App ID
            }
          }

          // Fetch price using multi-source (CheapShark + Steam)
          console.log(`  🔍 Fetching price for: ${game.name}${game.steamAppId ? ` (Steam ID: ${game.steamAppId})` : ''}`);
          const priceResult = await fetchGamePrice(game.name, game.steamAppId);
          game.price = priceResult.price;
          
          if (priceResult.price) {
            console.log(`  ✅ Found price for ${game.name}: $${priceResult.price} (from ${priceResult.source})`);
          } else {
            console.log(`  ⚠️  No price found for ${game.name}`);
          }
          
          // Upsert to database
          const result = await upsertGame(game);
          
          if (result.success) {
            if (priceResult.price) {
              successCount++;
              // Track which source provided the price
              if (priceResult.source === 'cheapshark') {
                cheapSharkCount++;
              } else if (priceResult.source === 'steam') {
                steamCount++;
              }
              return { 
                success: true, 
                game: game.name, 
                price: priceResult.price, 
                source: priceResult.source 
              };
            } else {
              noPriceCount++;
              return { 
                success: true, 
                game: game.name, 
                price: null, 
                reason: 'No price found from any source' 
              };
            }
          } else {
            errorCount++;
            return { success: false, game: game.name, error: result.error };
          }
        } catch (error) {
          console.error(`Error processing ${game.name}:`, error);
          errorCount++;
          return { success: false, game: game.name, error: error.message };
        }
      });

      await Promise.all(promises);
      
      if (onProgress) {
        onProgress(i + batch.length, games.length);
      }
      
      if (i + batchSize < games.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      success: true,
      total: games.length,
      successCount,
      noPriceCount,
      errorCount,
      skippedCount,
      cheapSharkCount,
      steamCount,
    };
  } catch (error) {
    console.error('Error syncing game prices:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the sync
// Change this number to fetch more/fewer games
// RAWG has 500,000+ games, but fetching prices takes time
// IMPORTANT: Start small (50-100) to avoid rate limiting, then increase gradually
// Recommended: Start with 50-100, then increase to 200-500 once working
const MAX_GAMES = 100; // Start with 100, increase gradually to avoid rate limits

console.log('🚀 Starting to populate games database...');
const estimatedMinutes = Math.ceil(MAX_GAMES / 10); // Rough estimate: ~10 games per minute
console.log(`⏳ This may take ${estimatedMinutes}-${estimatedMinutes + 5} minutes for ${MAX_GAMES} games...`);
console.log('📝 The script will:');
console.log('   1. Fetch games from RAWG.io API (names, genres, images, Steam IDs)');
console.log('   2. Fetch prices from multiple sources:');
console.log('      - Try CheapShark first (covers multiple stores)');
console.log('      - Fall back to Steam API if available');
console.log('   3. Store everything in your Supabase database\n');

syncAllGamePrices((current, total) => {
  const percentage = Math.round((current / total) * 100);
  process.stdout.write(`\r📊 Progress: ${current}/${total} games (${percentage}%)`);
}, MAX_GAMES).then(result => {
  console.log('\n\n✅ === Sync Complete ===');
  console.log(`📦 Total games processed: ${result.total}`);
  console.log(`✅ Successfully synced with prices: ${result.successCount}`);
  console.log(`   - From CheapShark: ${result.cheapSharkCount}`);
  console.log(`   - From Steam API: ${result.steamCount}`);
  console.log(`⚠️  Saved but no price found: ${result.noPriceCount} (normal - not all games have prices)`);
  console.log(`❌ Failed to save: ${result.errorCount}`);
  console.log(`⏭️  Skipped (already up to date): ${result.skippedCount}`);
  console.log('\n📊 Summary:');
  console.log(`   - ${result.successCount + result.noPriceCount} games saved to database`);
  console.log(`   - ${result.successCount} games have prices (${result.cheapSharkCount} from CheapShark, ${result.steamCount} from Steam)`);
  console.log(`   - ${result.noPriceCount} games saved without prices (will show "?" in app)`);
  console.log('\n🎉 Your games database is now populated with multi-source pricing!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error during sync:', error);
  process.exit(1);
});

