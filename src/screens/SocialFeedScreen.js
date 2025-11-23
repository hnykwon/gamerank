import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService, followService } from '../services/supabaseService';
import { getAllGames } from '../services/gameDatabaseService';
import { gameList as fallbackGameList } from '../data/gameList';
import GameImage from '../components/GameImage';

export default function SocialFeedScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [feedRankings, setFeedRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [starRatingModal, setStarRatingModal] = useState(false);
  const [comparisonModal, setComparisonModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStarRating, setSelectedStarRating] = useState(0);
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [gamesToCompare, setGamesToCompare] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesModal, setNotesModal] = useState(false);
  
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
    setSelectedGame({
      name: game.name,
      genre: game.genre || 'Unknown',
    });
    setStarRatingModal(true);
  };

  const handleStarRatingSelect = (stars) => {
    setSelectedStarRating(stars);
    setStarRatingModal(false);
    
    const gamesInSameCategory = myRankings
      .filter(game => {
        const gameStars = Math.floor(parseFloat(game.rating) / 2);
        return gameStars === stars;
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    if (gamesInSameCategory.length > 0) {
      setGamesToCompare(gamesInSameCategory);
      setCurrentComparisonIndex(0);
      setComparisonHistory([]);
      setComparisonModal(true);
    } else {
      const minScore = (stars - 1) * 2;
      const maxScore = stars * 2;
      const middleScore = (minScore + maxScore) / 2;
      saveGame({ 
        name: selectedGame.name, 
        genre: selectedGame.genre, 
        rating: middleScore.toFixed(2),
        starRating: stars,
        notes: notes.trim() || null,
      });
    }
  };

  const saveGame = async (game) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        await supabase.auth.signOut();
        return;
      }

      const rating = Math.max(0, Math.min(10, parseFloat(game.rating || '0')));

      const { data, error } = await rankingsService.addRanking(user.id, {
        name: game.name,
        genre: game.genre || 'Unknown',
        rating: rating.toFixed(2),
        starRating: game.starRating || 0,
        notes: notes.trim() || null,
      });

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        Alert.alert('Error', error.message || 'Failed to save game');
        console.error(error);
        return;
      }

      await loadMyRankings();
      await loadAllGames();
      
      setSelectedGame(null);
      setSelectedStarRating(0);
      setNotes('');
      
      Alert.alert('Success', 'Game ranked successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
  };

  const calculateRating = (position, totalGames, starRating) => {
    const minScore = (starRating - 1) * 2;
    const maxScore = starRating * 2;
    const range = maxScore - minScore;
    
    if (totalGames === 0) {
      return (minScore + maxScore) / 2;
    }
    
    const normalizedPosition = Math.max(0, Math.min(totalGames, position));
    const score = maxScore - (normalizedPosition / totalGames) * range;
    const clampedScore = Math.max(minScore, Math.min(maxScore, score));
    return Math.max(0, Math.min(10, clampedScore));
  };

  const handleGameChoice = (preferredGame) => {
    const currentGame = gamesToCompare[currentComparisonIndex];
    
    const comparison = {
      newGameBetter: preferredGame === 'new',
      comparedGame: currentGame,
      index: currentComparisonIndex,
    };
    
    setComparisonHistory([...comparisonHistory, comparison]);
    
    if (currentComparisonIndex < gamesToCompare.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1);
    } else {
      finishComparison();
    }
  };

  const handleUndo = () => {
    if (comparisonHistory.length > 0) {
      const newHistory = comparisonHistory.slice(0, -1);
      setComparisonHistory(newHistory);
      setCurrentComparisonIndex(Math.max(0, currentComparisonIndex - 1));
    }
  };

  const handleTooTough = () => {
    if (currentComparisonIndex < gamesToCompare.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1);
    } else {
      finishComparison();
    }
  };

  const handleSkip = () => {
    finishComparisonAtEnd();
  };

  const handleCancelComparison = () => {
    setComparisonModal(false);
    setSelectedGame(null);
    setSelectedStarRating(0);
    setNotes('');
    setCurrentComparisonIndex(0);
    setComparisonHistory([]);
    setGamesToCompare([]);
  };

  const finishComparison = async () => {
    let position = gamesToCompare.length;
    
    for (let i = 0; i < comparisonHistory.length; i++) {
      if (comparisonHistory[i].newGameBetter) {
        position = comparisonHistory[i].index;
        break;
      }
    }

    const numericalRating = calculateRating(position, gamesToCompare.length, selectedStarRating);
    await saveComparisonResult(numericalRating);
  };

  const finishComparisonAtEnd = async () => {
    const numericalRating = calculateRating(gamesToCompare.length, gamesToCompare.length, selectedStarRating);
    await saveComparisonResult(numericalRating);
  };

  const saveComparisonResult = async (numericalRating) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        await supabase.auth.signOut();
        return;
      }

      const clampedRating = Math.max(0, Math.min(10, numericalRating));

      const { data, error } = await rankingsService.addRanking(user.id, {
        name: selectedGame.name,
        genre: selectedGame.genre || 'Unknown',
        rating: clampedRating.toFixed(2),
        starRating: selectedStarRating,
        notes: notes.trim() || null,
      });

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        Alert.alert('Error', error.message || 'Failed to save game');
        console.error(error);
        return;
      }

      await loadMyRankings();
      await loadAllGames();
      
      setComparisonModal(false);
      setStarRatingModal(false);
      setSelectedGame(null);
      setSelectedStarRating(0);
      setNotes('');
      setCurrentComparisonIndex(0);
      setComparisonHistory([]);
      setGamesToCompare([]);
      
      Alert.alert('Success', 'Game ranked successfully!');
    } catch (error) {
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        await supabase.auth.signOut();
        return;
      }
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <Text style={styles.headerSubtitle}>
          Discover and rank games
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games to rank..."
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Results */}
      {searchQuery.trim() && (
        <View style={styles.searchResultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6c5ce7" />
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
                <ActivityIndicator size="large" color="#6c5ce7" />
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

      {/* Star Rating Modal */}
      <Modal
        visible={starRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setStarRatingModal(false);
          setSelectedGame(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate This Game</Text>
            <Text style={styles.modalSubtitle}>
              {selectedGame?.name}
            </Text>
            <Text style={styles.starRatingPrompt}>
              How many stars would you give this game?
            </Text>

            <View style={styles.horizontalStarContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setSelectedStarRating(star);
                  }}
                  style={styles.horizontalStarButton}
                >
                  <Text
                    style={[
                      styles.horizontalStar,
                      star <= selectedStarRating && styles.horizontalStarFilled,
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.starRatingActions}>
              <TouchableOpacity
                style={styles.notesButton}
                onPress={() => setNotesModal(true)}
              >
                <Text style={styles.notesButtonText}>📝 Notes</Text>
              </TouchableOpacity>
              
              <View style={styles.starRatingButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { flex: 1, marginRight: 5 }]}
                  onPress={() => {
                    setStarRatingModal(false);
                    setSelectedGame(null);
                    setSelectedStarRating(0);
                    setNotes('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { flex: 1, marginLeft: 5 }]}
                  onPress={() => {
                    if (selectedStarRating === 0) {
                      Alert.alert('Error', 'Please select a star rating');
                      return;
                    }
                    handleStarRatingSelect(selectedStarRating);
                  }}
                  disabled={selectedStarRating === 0}
                >
                  <Text style={[styles.modalButtonText, selectedStarRating === 0 && styles.disabledButtonText]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Add Notes</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setNotesModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedGame?.name}
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add your thoughts about this game..."
              placeholderTextColor="#95a5a6"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setNotesModal(false)}
            >
              <Text style={styles.modalButtonText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        visible={comparisonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelComparison}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Which do you prefer?</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelComparison}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sideBySideContainer}>
              <TouchableOpacity
                style={[styles.comparisonCard, { marginRight: 7.5 }]}
                onPress={() => handleGameChoice('new')}
                activeOpacity={0.7}
              >
                {selectedGame?.name && (
                  <GameImage 
                    gameName={selectedGame.name}
                    style={styles.comparisonCardImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.comparisonGameNameCenter} numberOfLines={3}>
                  {selectedGame?.name}
                </Text>
                <Text style={styles.comparisonGameGenre}>{selectedGame?.genre}</Text>
                <Text style={styles.ratingScore}>
                  {selectedStarRating} {selectedStarRating === 1 ? 'Star' : 'Stars'}
                </Text>
              </TouchableOpacity>

              {gamesToCompare[currentComparisonIndex] && (
                <TouchableOpacity
                  style={[styles.comparisonCard, { marginLeft: 7.5 }]}
                  onPress={() => handleGameChoice('existing')}
                  activeOpacity={0.7}
                >
                  <GameImage 
                    gameName={gamesToCompare[currentComparisonIndex].name}
                    style={styles.comparisonCardImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.comparisonGameNameCenter} numberOfLines={3}>
                    {gamesToCompare[currentComparisonIndex].name}
                  </Text>
                  <Text style={styles.comparisonGameGenre}>
                    {gamesToCompare[currentComparisonIndex].genre}
                  </Text>
                  <Text style={styles.ratingScore}>
                    {Math.max(0, Math.min(10, parseFloat(gamesToCompare[currentComparisonIndex].rating || 0))).toFixed(1)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.undoButton, { marginRight: 5 }]}
                onPress={handleUndo}
                disabled={comparisonHistory.length === 0}
              >
                <Text style={[styles.actionButtonText, comparisonHistory.length === 0 && styles.disabledButtonText]}>
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.tooToughButton, { marginHorizontal: 5 }]}
                onPress={handleTooTough}
              >
                <Text style={[styles.actionButtonText, styles.centeredButtonText]}>Too Tough</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton, { marginLeft: 5 }]}
                onPress={handleSkip}
              >
                <Text style={styles.actionButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchResultsContainer: {
    maxHeight: 300,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#2d3436',
  },
  searchResultsList: {
    padding: 15,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3436',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  placeholderContainer: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#636e72',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b2bec3',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  feedItem: {
    flexDirection: 'row',
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  feedGameImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#1a1a2e',
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
    color: '#6c5ce7',
  },
  feedDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  feedGameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  feedGenre: {
    fontSize: 12,
    color: '#95a5a6',
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
    color: '#fdcb6e',
  },
  starRatingContainer: {
    flexDirection: 'row',
  },
  feedStar: {
    fontSize: 14,
    color: '#636e72',
  },
  feedStarFilled: {
    color: '#fdcb6e',
  },
  feedNotesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d3436',
  },
  feedNotesLabel: {
    fontSize: 12,
    color: '#74b9ff',
    fontWeight: '600',
    marginBottom: 6,
  },
  feedNotesText: {
    fontSize: 14,
    color: '#b2bec3',
    lineHeight: 20,
  },
  emptyFeedContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyFeedText: {
    fontSize: 16,
    color: '#b2bec3',
    marginBottom: 8,
  },
  emptyFeedSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
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
  gameImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#1a1a2e',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#b2bec3',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#636e72',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  starRatingPrompt: {
    fontSize: 16,
    color: '#b2bec3',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  starContainer: {
    marginVertical: 20,
  },
  starButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#636e72',
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 32,
    color: '#636e72',
    marginHorizontal: 4,
  },
  starFilled: {
    color: '#fdcb6e',
  },
  starLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalStarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    gap: 15,
  },
  horizontalStarButton: {
    padding: 5,
  },
  horizontalStar: {
    fontSize: 48,
    color: '#636e72',
  },
  horizontalStarFilled: {
    color: '#fdcb6e',
  },
  starRatingActions: {
    marginTop: 20,
  },
  starRatingButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  notesButton: {
    backgroundColor: '#74b9ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  notesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#636e72',
    minHeight: 150,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  modalButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#636e72',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#636e72',
    minHeight: 280,
    justifyContent: 'flex-start',
    minWidth: '45%',
  },
  comparisonCardImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#2d3436',
  },
  comparisonGameNameCenter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  comparisonGameGenre: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  ratingScore: {
    color: '#fdcb6e',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  undoButton: {
    backgroundColor: '#636e72',
  },
  tooToughButton: {
    backgroundColor: '#fdcb6e',
  },
  skipButton: {
    backgroundColor: '#74b9ff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  centeredButtonText: {
    textAlign: 'center',
  },
});
