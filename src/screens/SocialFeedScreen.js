import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService, followService } from '../services/supabaseService';
import { getAllGames } from '../services/gameDatabaseService';
import { gameList as fallbackGameList } from '../data/gameList';
import GameImage from '../components/GameImage';
import AppHeader from '../components/AppHeader';
import { useGameRanking } from '../hooks/useGameRanking';
import GameRankingModals from '../components/GameRankingModals';

export default function SocialFeedScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [feedRankings, setFeedRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  
  const ranking = useGameRanking(async () => {
    await loadMyRankings();
    await loadAllGames();
    await loadFeed();
  });
  
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
    loadFeed();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAllGames(), loadMyRankings()]);
    setLoading(false);
  };

  const loadAllGames = async () => {
    try {
      const games = await getAllGames();
      const gamesWithIds = games.map((game, index) => ({
        id: game.id || `game-${index}`,
        name: game.name,
        genre: game.genre || 'Unknown',
        imageUrl: game.imageUrl || null,
      }));
      setAllGames(gamesWithIds);
    } catch (error) {
      console.error('Error loading games:', error);
      const gamesWithIds = fallbackGameList.map((game, index) => ({
        id: `game-${index}`,
        name: game.name,
        genre: game.genre,
        imageUrl: game.imageUrl || null,
      }));
      setAllGames(gamesWithIds);
    }
  };

  const loadMyRankings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        setMyRankings([]);
        return;
      }

      const { data, error } = await rankingsService.getUserRankings(user.id);
      
      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading rankings:', error);
        setMyRankings([]);
        return;
      }

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

  const loadFeed = async () => {
    setFeedLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        setFeedRankings([]);
        setFeedLoading(false);
        return;
      }

      const { data, error } = await followService.getFollowedUsersRankings(user.id);
      
      if (error) {
        // Handle case where follows table doesn't exist yet
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Follows table not found. Please run the migration SQL in Supabase.');
          setFeedRankings([]);
          setFeedLoading(false);
          return;
        }
        
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading feed:', error);
        setFeedRankings([]);
        setFeedLoading(false);
        return;
      }

      const transformedData = (data || []).map(item => ({
        id: item.id.toString(),
        gameName: item.game_name,
        genre: item.genre,
        rating: parseFloat(item.rating),
        starRating: item.star_rating,
        dateAdded: item.date_added,
        userId: item.user_id,
        username: item.profiles?.username || 'Unknown User',
        notes: item.notes || null,
      }));

      setFeedRankings(transformedData);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedRankings([]);
    } finally {
      setFeedLoading(false);
    }
  };

  const isGameRanked = (gameName) => {
    return myRankings.some((g) => 
      g.name.toLowerCase().trim() === gameName.toLowerCase().trim()
    );
  };

  const handleAddGame = (game) => {
    ranking.startRanking({
      name: game.name,
      genre: game.genre || 'Unknown',
      price: game.price || null,
    });
  };


  const filteredGames = allGames.filter((game) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        game.name.toLowerCase().includes(query) ||
        (game.genre && game.genre.toLowerCase().includes(query))
      );
    }
    return false;
  });

  const renderGameItem = ({ item }) => {
    const ranked = isGameRanked(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.gameItem, ranked && styles.rankedGameItem]}
        onPress={() => !ranked && handleAddGame(item)}
        disabled={ranked}
      >
        <GameImage 
          gameName={item.name}
          style={styles.gameImage}
          resizeMode="cover"
        />
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

  const renderFeedItem = ({ item }) => {
    return (
      <View style={styles.feedItem}>
        <GameImage 
          gameName={item.gameName}
          style={styles.feedGameImage}
          resizeMode="cover"
        />
        <View style={styles.feedItemInfo}>
          <View style={styles.feedItemHeader}>
            <Text style={styles.feedUsername}>{item.username}</Text>
            <Text style={styles.feedDate}>
              {new Date(item.dateAdded).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.feedGameName}>{item.gameName}</Text>
          <Text style={styles.feedGenre}>{item.genre}</Text>
          <View style={styles.feedRatingContainer}>
            <Text style={styles.feedRating}>
              {item.rating.toFixed(1)}/10
            </Text>
            <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={[
                    styles.feedStar,
                    star <= item.starRating && styles.feedStarFilled,
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
          {item.notes && (
            <View style={styles.feedNotesContainer}>
              <Text style={styles.feedNotesLabel}>📝 Notes:</Text>
              <Text style={styles.feedNotesText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games to rank..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Results */}
      {searchQuery.trim() && (
        <View style={styles.searchResultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#001f3f" />
            </View>
          ) : filteredGames.length > 0 ? (
            <FlatList
              data={filteredGames}
              renderItem={renderGameItem}
              keyExtractor={(item) => item.id}
              style={styles.searchResultsList}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.emptySearchContainer}>
              <Text style={styles.emptySearchText}>No games found</Text>
            </View>
          )}
        </View>
      )}

      {/* Main Content */}
      {!searchQuery.trim() && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Featured Lists Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Lists</Text>
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Featured lists coming soon!
              </Text>
              <Text style={styles.placeholderSubtext}>
                Discover curated game collections from top rankers
              </Text>
            </View>
          </View>

          {/* Your Feed */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Feed</Text>
            {feedLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#001f3f" />
                <Text style={styles.loadingText}>Loading feed...</Text>
              </View>
            ) : feedRankings.length > 0 ? (
              <FlatList
                data={feedRankings}
                renderItem={renderFeedItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                nestedScrollEnabled
              />
            ) : (
              <View style={styles.emptyFeedContainer}>
                <Text style={styles.emptyFeedText}>
                  No activity in your feed yet
                </Text>
                <Text style={styles.emptyFeedSubtext}>
                  Follow users to see their game rankings here
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <GameRankingModals
        starRatingModal={ranking.starRatingModal}
        comparisonModal={ranking.comparisonModal}
        notesModal={ranking.notesModal}
        selectedGame={ranking.selectedGame}
        selectedStarRating={ranking.selectedStarRating}
        notes={ranking.notes}
        currentComparisonIndex={ranking.currentComparisonIndex}
        comparisonHistory={ranking.comparisonHistory}
        gamesToCompare={ranking.gamesToCompare}
        onStarRatingSelect={ranking.handleStarRatingSelect}
        onGameChoice={ranking.handleGameChoice}
        onUndo={ranking.handleUndo}
        onTooTough={ranking.handleTooTough}
        onSkip={ranking.handleSkip}
        onCancelComparison={ranking.handleCancelComparison}
        onCancelStarRating={() => {
          ranking.setStarRatingModal(false);
          ranking.setSelectedGame(null);
          ranking.setSelectedStarRating(0);
          ranking.setNotes('');
        }}
        setSelectedStarRating={ranking.setSelectedStarRating}
        setNotes={ranking.setNotes}
        setNotesModal={ranking.setNotesModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    color: '#000',
    fontSize: 16,
    fontFamily: 'Raleway',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchResultsContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  searchResultsList: {
    padding: 15,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Raleway',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 15,
  },
  placeholderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
    textAlign: 'center',
  },
  feedItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  feedGameImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
  },
  feedItemInfo: {
    flex: 1,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedUsername: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#001f3f',
  },
  feedDate: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
  },
  feedGameName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 4,
  },
  feedGenre: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
    marginBottom: 8,
  },
  feedRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedRating: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
    color: '#001f3f',
  },
  starRatingContainer: {
    flexDirection: 'row',
  },
  feedStar: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#ddd',
  },
  feedStarFilled: {
    color: '#001f3f',
  },
  feedNotesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  feedNotesLabel: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#001f3f',
    fontWeight: '600',
    fontFamily: 'Raleway',
    marginBottom: 6,
  },
  feedNotesText: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
    lineHeight: 20,
  },
  emptyFeedContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyFeedText: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#666',
    marginBottom: 8,
  },
  emptyFeedSubtext: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
    textAlign: 'center',
  },
  gameItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rankedGameItem: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: '#001f3f',
  },
  gameImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Raleway',
    marginBottom: 5,
  },
  gameGenre: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Raleway',
  },
  addButton: {
    backgroundColor: '#001f3f',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  rankedBadge: {
    backgroundColor: '#001f3f',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  rankedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Raleway',
    marginTop: 15,
  },
});
