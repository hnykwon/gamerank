import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService } from '../services/supabaseService';
import { gameList } from '../data/gameList';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAllGames(), loadMyRankings()]);
    setLoading(false);
  };

  const loadAllGames = async () => {
    // Use all games from the gameList database
    // Add unique IDs for FlatList
    const gamesWithIds = gameList.map((game, index) => ({
      id: `game-${index}`,
      name: game.name,
      genre: game.genre,
    }));
    setAllGames(gamesWithIds);
  };

  const loadMyRankings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, user is not logged in, so no rankings
      if (!user || authError) {
        setMyRankings([]);
        return;
      }

      const { data, error } = await rankingsService.getUserRankings(user.id);
      
      // If error is due to authentication, sign out
      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading rankings:', error);
        setMyRankings([]);
        return;
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(item => ({
        id: item.id.toString(),
        name: item.game_name,
        genre: item.genre,
        rating: item.rating.toString(),
        starRating: item.star_rating,
        dateAdded: item.date_added,
      }));

      setMyRankings(transformedData);
    } catch (error) {
      console.error('Error loading rankings:', error);
      setMyRankings([]);
    }
  };

  const isGameRanked = (gameName) => {
    // Check if the current user has ranked this game (case-insensitive)
    return myRankings.some((g) => 
      g.name.toLowerCase().trim() === gameName.toLowerCase().trim()
    );
  };

  const handleAddGame = (game) => {
    navigation.navigate('Rank', { 
      initialGameName: game.name,
      initialGameGenre: game.genre,
    });
  };

  const filteredGames = allGames.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGameItem = ({ item }) => {
    const ranked = isGameRanked(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.gameItem, ranked && styles.rankedGameItem]}
        onPress={() => !ranked && handleAddGame(item)}
        disabled={ranked}
      >
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{item.name}</Text>
          <Text style={styles.gameGenre}>{item.genre}</Text>
        </View>
        {ranked ? (
          <View style={styles.rankedBadge}>
            <Text style={styles.rankedText}>✓ Ranked</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddGame(item)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Games</Text>
        <Text style={styles.headerSubtitle}>
          Browse all games and add them to your rankings
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games or genres..."
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No games found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#16213e',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b2bec3',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#16213e',
  },
  searchInput: {
    backgroundColor: '#2d3436',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  list: {
    padding: 15,
  },
  gameItem: {
    flexDirection: 'row',
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankedGameItem: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: '#00b894',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  gameGenre: {
    color: '#95a5a6',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankedBadge: {
    backgroundColor: '#00b894',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  rankedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 15,
  },
});

