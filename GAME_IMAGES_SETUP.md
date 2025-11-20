# Game Images Setup Guide

This guide will help you set up real game images using the RAWG.io API.

## Step 1: Get Your RAWG.io API Key

1. Go to [RAWG.io API Documentation](https://rawg.io/apidocs)
2. Sign up for a free account
3. Navigate to your API dashboard
4. Copy your API key

## Step 2: Add Your API Key

Open `src/services/gameImageService.js` and replace `YOUR_RAWG_API_KEY_HERE` with your actual API key:

```javascript
const RAWG_API_KEY = 'your-actual-api-key-here';
```

## Step 3: Choose Your Implementation

You have two options for displaying game images:

### Option A: Use GameImage Component (Recommended)

The `GameImage` component automatically handles async loading and shows placeholders while images load.

**Example usage:**
```javascript
import GameImage from '../components/GameImage';

// In your render:
<GameImage 
  gameName={game.name} 
  style={styles.gameImage}
  resizeMode="cover"
/>
```

### Option B: Use Regular Image Component

If you prefer to use the regular `Image` component, images will load asynchronously in the background. The first time a game is displayed, it will show a placeholder, then update to the real image once loaded.

**Example usage:**
```javascript
import { Image } from 'react-native';
import { getGameImageUrl, fetchAndCacheGameImage } from '../data/gameList';

// In your component:
const [imageUrl, setImageUrl] = useState(getGameImageUrl(game.name));

useEffect(() => {
  fetchAndCacheGameImage(game.name).then(setImageUrl);
}, [game.name]);

// In your render:
<Image source={{ uri: imageUrl }} style={styles.gameImage} />
```

## How It Works

1. **Caching**: Images are cached after the first fetch, so subsequent loads are instant
2. **Placeholder**: Shows a placeholder with the game name while loading
3. **Fallback**: If the API fails or game isn't found, it falls back to the placeholder
4. **Free Tier**: RAWG.io free tier allows 20,000 requests per month

## Preloading Images

To preload images when the app starts, you can use:

```javascript
import { preloadGameImages } from '../services/gameImageService';
import { gameList } from '../data/gameList';

// Preload all game images
const gameNames = gameList.map(game => game.name);
preloadGameImages(gameNames);
```

## Alternative: Use Your Own Images

If you prefer to host your own images or use a different service:

1. Update the `generatePlaceholderUrl` function in `src/data/gameList.js`
2. Or modify `fetchGameImageUrl` in `src/services/gameImageService.js` to use your image service

## Troubleshooting

- **Images not loading**: Check that your API key is correct
- **Rate limiting**: RAWG.io free tier has rate limits. Images are cached to minimize API calls
- **Slow loading**: Images load asynchronously. Use the GameImage component for better UX

