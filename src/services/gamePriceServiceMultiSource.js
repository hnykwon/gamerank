// Multi-Source Game Price Service
// Tries multiple APIs to get the best price coverage
// Falls back through: CheapShark -> Steam API -> Manual/Null

import { fetchGamePrice as fetchCheapSharkPrice } from './gamePriceService.js';

// Cache for price data
const priceCache = new Map();

/**
 * Fetches game price from Steam API
 * @param {string} gameName - The name of the game
 * @param {string} steamAppId - Optional Steam App ID for more accurate lookup
 * @returns {Promise<Object|null>} - Price information or null
 */
async function fetchSteamPrice(gameName, steamAppId = null) {
  try {
    // If we have a Steam App ID, use it directly
    if (steamAppId) {
      const url = `https://store.steampowered.com/api/appdetails?appids=${steAppId}&cc=US`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const appData = data[steamAppId];
        
        if (appData && appData.success && appData.data) {
          const priceData = appData.data.price_overview;
          if (priceData) {
            return {
              gameName: appData.data.name,
              cheapestPrice: (priceData.final / 100).toFixed(2), // Convert cents to dollars
              retailPrice: priceData.initial ? (priceData.initial / 100).toFixed(2) : null,
              savings: priceData.discount_percent ? priceData.discount_percent.toString() : null,
              store: 'Steam',
              dealUrl: `https://store.steampowered.com/app/${steamAppId}`,
              source: 'steam',
            };
          }
        }
      }
    }
    
    // If no Steam App ID, try searching (this is less reliable)
    // Note: Steam doesn't have a great search API, so this is limited
    return null;
  } catch (error) {
    console.warn(`Steam API error for ${gameName}:`, error.message);
    return null;
  }
}

/**
 * Multi-source price fetcher
 * Tries multiple sources in order until one succeeds
 * @param {string} gameName - The name of the game
 * @param {string} steamAppId - Optional Steam App ID
 * @returns {Promise<Object|null>} - Best price information found
 */
export const fetchGamePriceMultiSource = async (gameName, steamAppId = null) => {
  const cacheKey = `multi_${gameName.toLowerCase().trim()}_${steamAppId || ''}`;
  
  // Check cache first
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }

  let priceInfo = null;
  const sources = [];

  // 1. Try CheapShark first (fastest, covers multiple stores)
  try {
    console.log(`  Trying CheapShark for: ${gameName}`);
    priceInfo = await fetchCheapSharkPrice(gameName);
    if (priceInfo && priceInfo.cheapestPrice) {
      priceInfo.source = 'cheapshark';
      sources.push('cheapshark');
      priceCache.set(cacheKey, priceInfo);
      return priceInfo;
    }
  } catch (error) {
    console.warn(`  CheapShark failed for ${gameName}:`, error.message);
  }

  // 2. Try Steam API if we have a Steam App ID
  if (steamAppId) {
    try {
      console.log(`  Trying Steam API for: ${gameName} (App ID: ${steamAppId})`);
      priceInfo = await fetchSteamPrice(gameName, steamAppId);
      if (priceInfo && priceInfo.cheapestPrice) {
        priceInfo.source = 'steam';
        sources.push('steam');
        priceCache.set(cacheKey, priceInfo);
        return priceInfo;
      }
    } catch (error) {
      console.warn(`  Steam API failed for ${gameName}:`, error.message);
    }
  }

  // 3. Return null if no price found from any source
  if (!priceInfo || !priceInfo.cheapestPrice) {
    const noPriceInfo = {
      gameName: gameName,
      cheapestPrice: null,
      retailPrice: null,
      savings: null,
      store: null,
      dealUrl: null,
      source: null,
      sourcesTried: sources,
    };
    priceCache.set(cacheKey, noPriceInfo);
    return noPriceInfo;
  }

  priceCache.set(cacheKey, priceInfo);
  return priceInfo;
};

/**
 * Batch fetch prices from multiple sources
 * @param {Array<{name: string, steamAppId?: string}>} games - Array of game objects
 * @returns {Promise<Array>} - Array of price information
 */
export const fetchGamePricesBatch = async (games) => {
  const results = [];
  
  for (const game of games) {
    try {
      const priceInfo = await fetchGamePriceMultiSource(game.name, game.steamAppId);
      results.push({
        gameName: game.name,
        ...priceInfo,
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Failed to fetch price for ${game.name}:`, error.message);
      results.push({
        gameName: game.name,
        cheapestPrice: null,
        source: null,
      });
    }
  }
  
  return results;
};

/**
 * Clears the price cache
 */
export const clearPriceCache = () => {
  priceCache.clear();
};

