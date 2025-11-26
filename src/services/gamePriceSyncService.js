// Game Price Sync Service
// Fetches prices from CheapShark API and stores them in the database

import { fetchGamePrice } from './gamePriceService.js';
import { gamesService } from './supabaseService.js';
import { getAllGames } from './gameDatabaseService.js';

/**
 * Syncs prices for all games in the database
 * Fetches prices from CheapShark API and updates the games table
 * @param {Function} onProgress - Optional callback for progress updates (current, total)
 * @returns {Promise<Object>} - Summary of sync results
 */
export const syncAllGamePrices = async (onProgress = null) => {
  try {
    // Get all games from RAWG API
    const games = await getAllGames();
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const batchSize = 10;
    const delayBetweenBatches = 500; // ms

    // Process games in batches
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      
      // Process batch in parallel
      const pricePromises = batch.map(async (game) => {
        try {
          // First, check if game exists in database
          const { data: existingGame } = await gamesService.getGameByName(game.name);
          
          // If game exists and price was updated recently (within 7 days), skip
          if (existingGame && existingGame.price_updated_at) {
            const lastUpdate = new Date(existingGame.price_updated_at);
            const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 7 && existingGame.price) {
              skippedCount++;
              return { success: true, skipped: true, game: game.name };
            }
          }

          // Fetch price from CheapShark
          const priceInfo = await fetchGamePrice(game.name);
          
          if (priceInfo && priceInfo.cheapestPrice) {
            const price = parseFloat(priceInfo.cheapestPrice);
            
            // Upsert game with all metadata and price
            const gameData = {
              name: game.name,
              genre: game.genre || 'Unknown',
              imageUrl: game.imageUrl || null,
              price: price,
              id: game.id,
              released: game.released || null,
              rating: game.rating || null,
              platforms: game.platforms || null,
            };
            
            await gamesService.upsertGame(gameData);
            successCount++;
            return { success: true, game: game.name, price };
          } else {
            // Game not found or no price available
            // Still upsert the game with metadata but without price
            const gameData = {
              name: game.name,
              genre: game.genre || 'Unknown',
              imageUrl: game.imageUrl || null,
              price: null,
              id: game.id,
              released: game.released || null,
              rating: game.rating || null,
              platforms: game.platforms || null,
            };
            
            await gamesService.upsertGame(gameData);
            failCount++;
            return { success: false, game: game.name, reason: 'No price found' };
          }
        } catch (error) {
          console.error(`Error syncing price for ${game.name}:`, error);
          failCount++;
          return { success: false, game: game.name, error: error.message };
        }
      });

      await Promise.all(pricePromises);
      
      // Report progress
      if (onProgress) {
        onProgress(i + batch.length, games.length);
      }
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < games.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      success: true,
      total: games.length,
      successCount,
      failCount,
      skippedCount,
    };
  } catch (error) {
    console.error('Error syncing game prices:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Syncs price for a single game
 * @param {string} gameName - Name of the game
 * @returns {Promise<Object>} - Result of sync
 */
export const syncGamePrice = async (gameName) => {
  try {
    const priceInfo = await fetchGamePrice(gameName);
    
    if (priceInfo && priceInfo.cheapestPrice) {
      const price = parseFloat(priceInfo.cheapestPrice);
      const { data, error } = await gamesService.updateGamePrice(gameName, price);
      
      if (error) throw error;
      return { success: true, price, data };
    }
    
    return { success: false, reason: 'No price found' };
  } catch (error) {
    console.error(`Error syncing price for ${gameName}:`, error);
    return { success: false, error: error.message };
  }
};

