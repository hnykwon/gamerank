// Game Database Service using RAWG.io API
// Fetches games dynamically from RAWG.io instead of using a static list

import { gameList as fallbackGameList } from '../data/gameList.js';
import { trackAPIResponse, initUsageTracker } from './rawgUsageTracker.js';

const RAWG_API_KEY = 'd2b865c2d8ea46bda24975b72b12fb90';

// Initialize usage tracker
initUsageTracker();

// Cache for game lists
const gameListCache = new Map();
const searchCache = new Map();

/**
 * Fetches popular games from RAWG.io
 * @param {number} pageSize - Number of games to fetch (default: 100)
 * @param {string} ordering - Ordering parameter (default: '-rating' for highest rated)
 * @returns {Promise<Array>} - Array of game objects
 */
export const fetchPopularGames = async (pageSize = 100, ordering = '-rating') => {
  const cacheKey = `popular_${pageSize}_${ordering}`;
  
  // Check cache first
  if (gameListCache.has(cacheKey)) {
    return gameListCache.get(cacheKey);
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=${pageSize}&ordering=${ordering}&metacritic=70,100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Track API usage (after checking response is ok)
    await trackAPIResponse(response);

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Transform RAWG.io format to our format
      const games = data.results.map(game => ({
        id: game.id,
        name: game.name,
        genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Unknown',
        imageUrl: game.background_image || null,
        rating: game.rating || 0,
        released: game.released,
        platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
      }));
      
      gameListCache.set(cacheKey, games);
      console.log(`✓ Fetched ${games.length} popular games from RAWG.io`);
      return games;
    }
    
    return [];
  } catch (error) {
    console.warn('Failed to fetch games from RAWG.io, using fallback:', error.message);
    // Return fallback list
    return fallbackGameList;
  }
};

/**
 * Searches for games on RAWG.io
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results (default: 20)
 * @returns {Promise<Array>} - Array of game objects
 */
export const searchGamesOnRAWG = async (query, pageSize = 20) => {
  if (!query || query.trim() === '') {
    return [];
  }

  const cacheKey = `search_${query.toLowerCase()}_${pageSize}`;
  
  // Check cache first
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Track API usage (after checking response is ok)
    await trackAPIResponse(response);

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Transform RAWG.io format to our format
      const games = data.results.map(game => ({
        id: game.id,
        name: game.name,
        genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Unknown',
        imageUrl: game.background_image || null,
        rating: game.rating || 0,
        released: game.released,
        platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
      }));
      
      searchCache.set(cacheKey, games);
      return games;
    }
    
    return [];
  } catch (error) {
    console.warn(`Failed to search games on RAWG.io:`, error.message);
    // Fallback to local search
    return searchLocalGames(query);
  }
};

/**
 * Searches local game list (fallback)
 */
const searchLocalGames = (query) => {
  const lowerQuery = query.toLowerCase();
  return fallbackGameList.filter(game => 
    game.name.toLowerCase().includes(lowerQuery) ||
    game.genre.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Main search function - tries RAWG.io API first, falls back to local search
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results (default: 20)
 * @returns {Promise<Array>} - Array of game objects
 */
export const searchGames = async (query, pageSize = 20) => {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    // Try to use RAWG.io API first
    const apiResults = await searchGamesOnRAWG(query, pageSize);
    
    if (apiResults && apiResults.length > 0) {
      return apiResults;
    }
  } catch (error) {
    console.warn('API search failed, using local search:', error.message);
  }
  
  // Fallback to local search
  return searchLocalGames(query);
};

/**
 * Fetches games by genre from RAWG.io
 * @param {string} genre - Genre name (e.g., 'action', 'rpg')
 * @param {number} pageSize - Number of games to fetch
 * @returns {Promise<Array>} - Array of game objects
 */
export const fetchGamesByGenre = async (genre, pageSize = 50) => {
  const cacheKey = `genre_${genre}_${pageSize}`;
  
  if (gameListCache.has(cacheKey)) {
    return gameListCache.get(cacheKey);
  }

  try {
    // First, we need to get the genre ID
    const genresUrl = `https://api.rawg.io/api/genres?key=${RAWG_API_KEY}`;
    const genresResponse = await fetch(genresUrl);
    
    if (!genresResponse.ok) {
      throw new Error('Failed to fetch genres');
    }
    
    // Track API usage (after checking response is ok)
    await trackAPIResponse(genresResponse);
    
    const genresData = await genresResponse.json();
    const genreObj = genresData.results?.find(g => 
      g.name.toLowerCase() === genre.toLowerCase() || 
      g.slug === genre.toLowerCase()
    );
    
    if (!genreObj) {
      return [];
    }
    
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&genres=${genreObj.id}&page_size=${pageSize}&ordering=-rating`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Track API usage (after checking response is ok)
    await trackAPIResponse(response);

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const games = data.results.map(game => ({
        id: game.id,
        name: game.name,
        genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Unknown',
        imageUrl: game.background_image || null,
        rating: game.rating || 0,
        released: game.released,
        platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
      }));
      
      gameListCache.set(cacheKey, games);
      return games;
    }
    
    return [];
  } catch (error) {
    console.warn(`Failed to fetch games by genre:`, error.message);
    return [];
  }
};

/**
 * Gets all available games (combines popular games from API with fallback)
 * @returns {Promise<Array>} - Array of all game objects
 */
export const getAllGames = async () => {
  try {
    // Try to fetch popular games from RAWG.io
    const apiGames = await fetchPopularGames(200); // Get top 200 games
    
    // Merge with fallback list, removing duplicates
    const allGames = [...apiGames];
    const apiGameNames = new Set(apiGames.map(g => g.name.toLowerCase()));
    
    // Add fallback games that aren't in API results
    fallbackGameList.forEach(game => {
      if (!apiGameNames.has(game.name.toLowerCase())) {
        allGames.push({
          id: `fallback_${game.name}`,
          name: game.name,
          genre: game.genre,
          imageUrl: game.imageUrl || null,
          rating: 0,
          released: null,
          platforms: [],
        });
      }
    });
    
    return allGames;
  } catch (error) {
    console.warn('Failed to get all games, using fallback:', error.message);
    return fallbackGameList;
  }
};

/**
 * Fetches detailed game information by ID from RAWG.io
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<Object|null>} - Detailed game object or null
 */
export const fetchGameDetailsById = async (gameId) => {
  const cacheKey = `details_${gameId}`;
  
  if (gameListCache.has(cacheKey)) {
    return gameListCache.get(cacheKey);
  }

  try {
    const url = `https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    await trackAPIResponse(response);
    const data = await response.json();

    const gameDetails = {
      id: data.id,
      name: data.name,
      genre: data.genres && data.genres.length > 0 ? data.genres[0].name : 'Unknown',
      imageUrl: data.background_image || null,
      rating: data.rating || 0,
      released: data.released,
      platforms: data.platforms ? data.platforms.map(p => p.platform.name) : [],
      description: data.description_raw || data.description || '',
      website: data.website || null,
      stores: data.stores ? data.stores.map(store => ({
        id: store.store?.id,
        name: store.store?.name,
        url: store.url,
      })) : [],
    };

    gameListCache.set(cacheKey, gameDetails);
    return gameDetails;
  } catch (error) {
    console.warn(`Failed to fetch game details for ID ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Clears all caches
 */
export const clearGameCache = () => {
  gameListCache.clear();
  searchCache.clear();
};

