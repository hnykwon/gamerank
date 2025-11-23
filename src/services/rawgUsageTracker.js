// RAWG API Usage Tracker
// Tracks API calls and monitors usage from response headers

import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_STORAGE_KEY = '@rawg_api_usage';
const USAGE_STATS_KEY = '@rawg_api_stats';

// Local usage tracking
let callCount = 0;
let lastResetDate = null;

/**
 * Initialize usage tracker
 */
export const initUsageTracker = async () => {
  try {
    const stored = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      callCount = data.callCount || 0;
      lastResetDate = data.lastResetDate ? new Date(data.lastResetDate) : new Date();
      
      // Reset if it's a new month
      const now = new Date();
      if (now.getMonth() !== lastResetDate.getMonth() || 
          now.getFullYear() !== lastResetDate.getFullYear()) {
        callCount = 0;
        lastResetDate = now;
        await saveUsageData();
      }
    } else {
      lastResetDate = new Date();
      await saveUsageData();
    }
  } catch (error) {
    console.error('Error initializing usage tracker:', error);
  }
};

/**
 * Save usage data to storage
 */
const saveUsageData = async () => {
  try {
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify({
      callCount,
      lastResetDate: lastResetDate.toISOString(),
    }));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
};

/**
 * Track an API call
 */
export const trackAPICall = async () => {
  callCount++;
  await saveUsageData();
  
  // Update stats
  await updateStats();
};

/**
 * Extract rate limit info from response headers
 */
export const extractRateLimitInfo = (response) => {
  if (!response || !response.headers) {
    return { remaining: null, limit: null, reset: null };
  }

  let headers;
  // Handle different response header formats
  if (typeof response.headers.get === 'function') {
    // Standard Headers object
    headers = response.headers;
  } else if (response.headers) {
    // Plain object
    headers = {
      get: (name) => response.headers[name] || response.headers[name.toLowerCase()] || null
    };
  } else {
    return { remaining: null, limit: null, reset: null };
  }
  
  // RAWG API provides these headers (if available)
  // Try various casing variations
  const rateLimitRemaining = headers.get('x-ratelimit-remaining') || 
                             headers.get('X-RateLimit-Remaining') ||
                             headers.get('X-Rate-Limit-Remaining') ||
                             null;
  
  const rateLimitLimit = headers.get('x-ratelimit-limit') ||
                         headers.get('X-RateLimit-Limit') ||
                         headers.get('X-Rate-Limit-Limit') ||
                         null;
  
  const rateLimitReset = headers.get('x-ratelimit-reset') ||
                         headers.get('X-RateLimit-Reset') ||
                         headers.get('X-Rate-Limit-Reset') ||
                         null;

  return {
    remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
    limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : null,
    reset: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
  };
};

/**
 * Update stats with rate limit info
 */
const updateStats = async (rateLimitInfo = null) => {
  try {
    const stats = {
      localCallCount: callCount,
      lastUpdate: new Date().toISOString(),
      rateLimitInfo,
    };
    
    await AsyncStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

/**
 * Get current usage statistics
 */
export const getUsageStats = async () => {
  try {
    const statsData = await AsyncStorage.getItem(USAGE_STATS_KEY);
    const usageData = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    
    const stats = statsData ? JSON.parse(statsData) : {};
    const usage = usageData ? JSON.parse(usageData) : {};
    
    return {
      localCallsThisMonth: callCount || usage.callCount || 0,
      lastResetDate: lastResetDate || (usage.lastResetDate ? new Date(usage.lastResetDate) : new Date()),
      rateLimitRemaining: stats.rateLimitInfo?.remaining || null,
      rateLimitLimit: stats.rateLimitInfo?.limit || null,
      rateLimitReset: stats.rateLimitInfo?.reset || null,
      lastUpdate: stats.lastUpdate || null,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      localCallsThisMonth: callCount,
      lastResetDate,
      rateLimitRemaining: null,
      rateLimitLimit: null,
      rateLimitReset: null,
      lastUpdate: null,
    };
  }
};

/**
 * Reset usage counter (for testing or new month)
 */
export const resetUsageCounter = async () => {
  callCount = 0;
  lastResetDate = new Date();
  await saveUsageData();
};

/**
 * Wrapper function to track API calls and extract rate limit info
 */
export const trackAPIResponse = async (response) => {
  await trackAPICall();
  
  const rateLimitInfo = extractRateLimitInfo(response);
  if (rateLimitInfo.remaining !== null || rateLimitInfo.limit !== null) {
    await updateStats(rateLimitInfo);
  }
  
  return rateLimitInfo;
};

