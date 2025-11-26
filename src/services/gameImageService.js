// Game Image Service - Checks database first, then falls back to RAWG.io API
// Get your free API key at: https://rawg.io/apidocs

// IMPORTANT: Replace this with your RAWG.io API key
// Sign up at https://rawg.io/apidocs to get a free API key
const RAWG_API_KEY = 'd2b865c2d8ea46bda24975b72b12fb90'; // Replace with your actual API key

import { trackAPIResponse, initUsageTracker } from './rawgUsageTracker.js';
import { supabase } from '../config/supabase.js';

// Initialize usage tracker
initUsageTracker();

// Cache to avoid repeated API calls
const imageCache = new Map();

/**
 * Fetches game image URL from RAWG.io API
 * @param {string} gameName - The name of the game
 * @returns {Promise<string>} - The image URL or placeholder if not found
 */
// Helper to clean game name for better matching
const cleanGameName = (name) => {
  return name
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove text in parentheses like "(2018)"
    .replace(/\s*:\s*/g, ' ') // Replace colons with spaces
    .trim()
    .toLowerCase();
};

// Helper to check if game names match (fuzzy matching)
const gameNamesMatch = (name1, name2) => {
  const clean1 = cleanGameName(name1);
  const clean2 = cleanGameName(name2);
  
  // Exact match
  if (clean1 === clean2) return true;
  
  // Check if one contains the other (for partial matches)
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    // Make sure it's a significant match (at least 5 characters)
    const minLength = Math.min(clean1.length, clean2.length);
    return minLength >= 5;
  }
  
  return false;
};

export const fetchGameImageUrl = async (gameName) => {
  // Check cache first
  if (imageCache.has(gameName)) {
    const cachedUrl = imageCache.get(gameName);
    // Check if cached URL indicates source
    if (cachedUrl.source) {
      return cachedUrl.url || cachedUrl;
    }
    return cachedUrl;
  }

  // STEP 1: Try to get image from database first
  try {
    const { data: dbGame, error: dbError } = await supabase
      .from('games')
      .select('image_url, name')
      .eq('name', gameName)
      .single();

    if (!dbError && dbGame && dbGame.image_url) {
      // Found image in database!
      imageCache.set(gameName, dbGame.image_url);
      console.log(`✓ Found image for: ${gameName} -> ${dbGame.name} [DATABASE]`);
      return dbGame.image_url;
    }
  } catch (error) {
    // Database query failed, continue to API fallback
    console.warn(`Database check failed for ${gameName}, trying API...`);
  }

  // STEP 2: Fallback to RAWG API if not in database
  // If no API key is set, return placeholder
  if (!RAWG_API_KEY || RAWG_API_KEY === 'YOUR_RAWG_API_KEY_HERE') {
    const placeholderUrl = generatePlaceholderUrl(gameName);
    imageCache.set(gameName, placeholderUrl);
    return placeholderUrl;
  }

  try {
    // Try exact search first
    let searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameName)}&page_size=5`;
    
    let response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Track API usage (after checking response is ok)
    await trackAPIResponse(response);

    let data = await response.json();
    
    // Try to find a good match
    if (data.results && data.results.length > 0) {
      // First, try to find exact or close match
      let matchedGame = data.results.find(game => 
        gameNamesMatch(game.name, gameName)
      );
      
      // If no close match, use the first result
      if (!matchedGame) {
        matchedGame = data.results[0];
      }
      
      // Prefer background_image (usually the best quality)
      // Fallback to screenshots if available
      const imageUrl = matchedGame.background_image || 
                      (matchedGame.short_screenshots && matchedGame.short_screenshots.length > 0 && matchedGame.short_screenshots[0]?.image) ||
                      null;
      
      if (imageUrl) {
        imageCache.set(gameName, imageUrl);
        console.log(`✓ Found image for: ${gameName} -> ${matchedGame.name} [RAWG API]`);
        return imageUrl;
      }
    }

    // If no results, try a simplified search (remove common suffixes)
    const simplifiedName = gameName
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses
      .replace(/\s*:\s*.*$/, '') // Remove everything after colon
      .trim();
    
    if (simplifiedName !== gameName && simplifiedName.length > 3) {
      searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(simplifiedName)}&page_size=3`;
      response = await fetch(searchUrl);
      
      if (response.ok) {
        // Track API usage (after checking response is ok)
        await trackAPIResponse(response);
        data = await response.json();
        if (data.results && data.results.length > 0) {
          const game = data.results[0];
          const imageUrl = game.background_image || 
                         (game.short_screenshots && game.short_screenshots[0]?.image) ||
                         null;
          
          if (imageUrl) {
            imageCache.set(gameName, imageUrl);
            console.log(`✓ Found image for: ${gameName} (simplified: ${simplifiedName}) -> ${game.name} [RAWG API]`);
            return imageUrl;
          }
        }
      }
    }

    // If no image found, use placeholder
    console.warn(`⚠ No image found for: ${gameName}`);
    const placeholderUrl = generatePlaceholderUrl(gameName);
    imageCache.set(gameName, placeholderUrl);
    return placeholderUrl;
  } catch (error) {
    console.warn(`Failed to fetch image for ${gameName}:`, error.message);
    // Return placeholder on error
    const placeholderUrl = generatePlaceholderUrl(gameName);
    imageCache.set(gameName, placeholderUrl);
    return placeholderUrl;
  }
};

/**
 * Generates a placeholder URL
 */
const generatePlaceholderUrl = (gameName) => {
  const encodedName = encodeURIComponent(gameName);
  return `https://via.placeholder.com/300x400/2d3436/ffffff?text=${encodedName}`;
};

/**
 * Pre-fetches images for a list of games (useful for initial load)
 * @param {Array<string>} gameNames - Array of game names
 */
export const preloadGameImages = async (gameNames) => {
  const promises = gameNames.map(name => fetchGameImageUrl(name));
  await Promise.all(promises);
};

/**
 * Clears the image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
};

