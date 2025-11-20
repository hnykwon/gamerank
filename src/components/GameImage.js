import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { getGameImageUrl, fetchAndCacheGameImage } from '../data/gameList';

/**
 * GameImage component that loads game images asynchronously
 * Falls back to placeholder while loading
 */
export default function GameImage({ gameName, style, resizeMode = 'cover', ...props }) {
  const [imageUrl, setImageUrl] = useState(getGameImageUrl(gameName));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start with placeholder
    const placeholder = getGameImageUrl(gameName);
    setImageUrl(placeholder);
    setIsLoading(true);

    // Fetch real image in background
    fetchAndCacheGameImage(gameName)
      .then((url) => {
        setImageUrl(url);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [gameName]);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        {...props}
      />
      {isLoading && imageUrl.includes('via.placeholder.com') && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6c5ce7" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

