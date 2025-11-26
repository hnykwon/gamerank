import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GameImage from '../components/GameImage';
import { fetchGamePrice } from '../services/gamePriceService';
import { fetchGameDetailsById } from '../services/gameDatabaseService';

export default function GameDetailScreen({ route }) {
  const { game } = route.params || {};
  const [priceInfo, setPriceInfo] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [gameDetails, setGameDetails] = useState(null);

  useEffect(() => {
    if (game) {
      loadPriceInfo();
      // If game has a RAWG ID, fetch additional details
      if (game.id && typeof game.id === 'number') {
        loadGameDetails();
      }
    }
  }, [game]);

  const loadPriceInfo = async () => {
    setLoadingPrice(true);
    try {
      const gameName = game.name || game.game_name;
      const price = await fetchGamePrice(gameName);
      setPriceInfo(price);
    } catch (error) {
      console.error('Error loading price:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const loadGameDetails = async () => {
    try {
      const details = await fetchGameDetailsById(game.id);
      setGameDetails(details);
    } catch (error) {
      console.error('Error loading game details:', error);
    }
  };

  const handlePriceLinkPress = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  const displayGame = gameDetails || game;
  const gameName = displayGame.name || game.game_name;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <GameImage 
            gameName={gameName}
            style={styles.gameImage}
            resizeMode="cover"
          />
          <Text style={styles.title}>{gameName}</Text>
          <Text style={styles.genre}>{displayGame.genre || game.genre || 'Unknown Genre'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Rating:</Text>
            <Text style={styles.value}>
              {displayGame.rating ? Math.max(0, Math.min(10, parseFloat(displayGame.rating))).toFixed(1) : 'Not rated'}
            </Text>
          </View>

          {displayGame.released && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Released:</Text>
              <Text style={styles.value}>
                {new Date(displayGame.released).toLocaleDateString()}
              </Text>
            </View>
          )}

          {game.dateAdded && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date Added:</Text>
              <Text style={styles.value}>
                {new Date(game.dateAdded).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Price Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Information</Text>
          {loadingPrice ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Loading price...</Text>
            </View>
          ) : priceInfo && priceInfo.cheapestPrice ? (
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>Best Price:</Text>
                  <Text style={styles.priceValue}>${priceInfo.cheapestPrice}</Text>
                  {priceInfo.retailPrice && (
                    <Text style={styles.retailPrice}>${priceInfo.retailPrice} retail</Text>
                  )}
                </View>
                {priceInfo.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>-{priceInfo.savings}%</Text>
                  </View>
                )}
              </View>
              {priceInfo.store && (
                <Text style={styles.storeText}>Available at: {priceInfo.store}</Text>
              )}
              {priceInfo.dealUrl && (
                <TouchableOpacity 
                  style={styles.dealButton}
                  onPress={() => handlePriceLinkPress(priceInfo.dealUrl)}
                >
                  <Ionicons name="link-outline" size={16} color="#000" />
                  <Text style={styles.dealButtonText}>View Deal</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noPriceText}>Price information not available</Text>
          )}
        </View>

        {/* Platforms Section */}
        {displayGame.platforms && displayGame.platforms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformsContainer}>
              {displayGame.platforms.map((platform, index) => (
                <View key={index} style={styles.platformTag}>
                  <Text style={styles.platformText}>{platform}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Details</Text>
          <Text style={styles.description}>
            {displayGame.description || 
             'This game is part of your personal ranking list. You can compare it with other games you\'ve ranked to see how it stacks up!'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  gameImage: {
    width: 200,
    height: 280,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  genre: {
    fontSize: 18,
    fontFamily: 'Raleway',
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#000',
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#666',
    lineHeight: 24,
  },
  errorText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Raleway',
    textAlign: 'center',
    marginTop: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
  },
  priceContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 28,
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: '#000',
  },
  retailPrice: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  savingsText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Raleway',
    fontWeight: 'bold',
  },
  storeText: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
    marginTop: 8,
  },
  dealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#000',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dealButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Raleway',
    fontWeight: '600',
    marginLeft: 6,
  },
  noPriceText: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  platformTag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  platformText: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#000',
  },
});

