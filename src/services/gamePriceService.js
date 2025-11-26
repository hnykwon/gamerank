// Game Price Service using CheapShark API
// Free API that provides game prices and deals from multiple stores
// Documentation: https://apidocs.cheapshark.com/

import { trackAPIResponse } from './rawgUsageTracker.js';

// Cache for price data
const priceCache = new Map();

/**
 * Fetches game price information from CheapShark API
 * @param {string} gameName - The name of the game
 * @returns {Promise<Object|null>} - Price information object or null if not found
 */
export const fetchGamePrice = async (gameName) => {
  // Check cache first
  const cacheKey = gameName.toLowerCase().trim();
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }

  try {
    // CheapShark API search endpoint
    const searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameName)}&limit=5`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Price API request failed with status ${response.status}`);
    }

    // Track API usage (using same tracker for consistency)
    await trackAPIResponse(response);

    const data = await response.json();
    
    if (data && data.length > 0) {
      // Find the best match (exact or closest)
      let bestMatch = data.find(game => 
        game.external.toLowerCase() === gameName.toLowerCase()
      );
      
      // If no exact match, use the first result
      if (!bestMatch) {
        bestMatch = data[0];
      }

      // Get detailed deal information using the deals endpoint
      const gameId = bestMatch.gameID;
      const dealsUrl = `https://www.cheapshark.com/api/1.0/deals?gameID=${gameId}`;
      
      const dealsResponse = await fetch(dealsUrl);
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        
        // Find the cheapest deal
        let cheapestDeal = null;
        let lowestPrice = Infinity;
        
        // Handle both array and object responses
        const deals = Array.isArray(dealsData) ? dealsData : (dealsData.deals || []);
        
        if (deals && deals.length > 0) {
          deals.forEach(deal => {
            const price = parseFloat(deal.price || deal.salePrice || 0);
            if (price > 0 && price < lowestPrice) {
              lowestPrice = price;
              const retailPrice = parseFloat(deal.normalPrice || deal.retailPrice || 0);
              const savings = retailPrice > 0 ? ((1 - price / retailPrice) * 100) : parseFloat(deal.savings || 0);
              
              cheapestDeal = {
                store: deal.storeName || deal.storeID || 'Unknown Store',
                price: price.toFixed(2),
                retailPrice: retailPrice > 0 ? retailPrice.toFixed(2) : null,
                savings: savings > 0 ? savings.toFixed(0) : null,
                dealUrl: deal.dealID ? `https://www.cheapshark.com/redirect?dealID=${deal.dealID}` : null,
              };
            }
          });
        }

        const priceInfo = {
          gameId: gameId,
          gameName: bestMatch.external,
          cheapestPrice: cheapestDeal ? cheapestDeal.price : null,
          retailPrice: cheapestDeal ? cheapestDeal.retailPrice : null,
          savings: cheapestDeal ? cheapestDeal.savings : null,
          store: cheapestDeal ? cheapestDeal.store : null,
          dealUrl: cheapestDeal ? cheapestDeal.dealUrl : null,
          allDeals: deals || [],
          steamAppId: bestMatch.steamAppID || null,
        };

        priceCache.set(cacheKey, priceInfo);
        return priceInfo;
      }
    }

    // No price found
    const noPriceInfo = {
      gameName: gameName,
      cheapestPrice: null,
      retailPrice: null,
      savings: null,
      store: null,
      dealUrl: null,
      allDeals: [],
    };
    
    priceCache.set(cacheKey, noPriceInfo);
    return noPriceInfo;
  } catch (error) {
    console.warn(`Failed to fetch price for ${gameName}:`, error.message);
    return null;
  }
};

/**
 * Fetches detailed game information from RAWG including store links
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<Object|null>} - Game details with stores or null
 */
export const fetchGameDetailsFromRAWG = async (gameId) => {
  const RAWG_API_KEY = 'd2b865c2d8ea46bda24975b72b12fb90';
  const cacheKey = `rawg_details_${gameId}`;
  
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }

  try {
    const url = `https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`RAWG API request failed with status ${response.status}`);
    }

    await trackAPIResponse(response);
    const data = await response.json();

    const gameDetails = {
      id: data.id,
      name: data.name,
      description: data.description_raw || data.description,
      released: data.released,
      rating: data.rating,
      stores: data.stores ? data.stores.map(store => ({
        id: store.store?.id,
        name: store.store?.name,
        url: store.url,
      })) : [],
      website: data.website,
      platforms: data.platforms ? data.platforms.map(p => p.platform.name) : [],
    };

    priceCache.set(cacheKey, gameDetails);
    return gameDetails;
  } catch (error) {
    console.warn(`Failed to fetch RAWG details for game ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Clears the price cache
 */
export const clearPriceCache = () => {
  priceCache.clear();
};

