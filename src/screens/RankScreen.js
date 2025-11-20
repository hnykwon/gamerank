import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService } from '../services/supabaseService';
import { searchGames } from '../services/gameDatabaseService';
import GameImage from '../components/GameImage';

export default function RankScreen() {
  const [gameName, setGameName] = useState('');
  const [gameGenre, setGameGenre] = useState('');
  const [existingGames, setExistingGames] = useState([]);
  const [starRatingModal, setStarRatingModal] = useState(false);
  const [comparisonModal, setComparisonModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStarRating, setSelectedStarRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [gamesToCompare, setGamesToCompare] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    loadExistingGames();
    // Handle initial params from navigation
    if (route.params?.initialGameName) {
      setGameName(route.params.initialGameName);
    }
    if (route.params?.initialGameGenre) {
      setGameGenre(route.params.initialGameGenre);
    }
  }, [route.params]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await searchGames(searchQuery);
          // Limit results to 10 to avoid needing nested scrolling
          setSearchResults(results.slice(0, 10));
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    performSearch();
  }, [searchQuery]);

  const loadExistingGames = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, sign out and redirect to login
      if (!user || authError) {
        await supabase.auth.signOut();
        setExistingGames([]);
        return;
      }

      const { data, error } = await rankingsService.getUserRankings(user.id);
      
      // If error is due to authentication, sign out
      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading games:', error);
        setExistingGames([]);
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

      setExistingGames(transformedData);
    } catch (error) {
      console.error('Error loading games:', error);
      setExistingGames([]);
    }
  };

  const handleRankGame = () => {
    if (!gameName.trim()) {
      Alert.alert('Error', 'Please select a game');
      return;
    }

    // Show star rating modal first
    setSelectedGame({
      name: gameName,
      genre: gameGenre,
    });
    setStarRatingModal(true);
  };

  const handleStarRatingSelect = (stars) => {
    setSelectedStarRating(stars);
    setStarRatingModal(false);
    
    // Get games with the same star rating, sorted by rating
    const gamesInSameCategory = existingGames
      .filter(game => {
        const gameStars = Math.floor(parseFloat(game.rating) / 2);
        return gameStars === stars;
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    if (gamesInSameCategory.length > 0) {
      // Set up comparison state
      setGamesToCompare(gamesInSameCategory);
      setCurrentComparisonIndex(0);
      setComparisonHistory([]);
      setComparisonModal(true);
    } else {
      // No games in this category, save directly with middle score
      const minScore = (stars - 1) * 2;
      const maxScore = stars * 2;
      const middleScore = (minScore + maxScore) / 2;
      saveGame({ 
        name: selectedGame.name, 
        genre: selectedGame.genre, 
        rating: middleScore.toFixed(2),
        starRating: stars 
      });
    }
  };

  const saveGame = async (game) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, sign out and redirect to login
      if (!user || authError) {
        await supabase.auth.signOut();
        return;
      }

      // Clamp rating between 0 and 10
      const rating = Math.max(0, Math.min(10, parseFloat(game.rating || '0')));

      const { data, error } = await rankingsService.addRanking(user.id, {
        name: game.name,
        genre: game.genre || 'Unknown',
        rating: rating.toFixed(2),
        starRating: game.starRating || 0,
      });

      if (error) {
        // If error is due to authentication, sign out
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        Alert.alert('Error', error.message || 'Failed to save game');
        console.error(error);
        return;
      }

      // Reload games to update the list
      await loadExistingGames();
      
      Alert.alert('Success', 'Game ranked successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setGameName('');
            setGameGenre('');
            setSearchQuery('');
            setShowSearchResults(false);
            setSelectedStarRating(0);
            setSelectedGame(null);
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
  };

  const calculateRating = (position, totalGames, starRating) => {
    // Each star category gets a 2-point range:
    // 1 star: 0-2, 2 star: 2-4, 3 star: 4-6, 4 star: 6-8, 5 star: 8-10
    const minScore = (starRating - 1) * 2; // Minimum for this star category
    const maxScore = starRating * 2; // Maximum for this star category
    const range = maxScore - minScore; // Always 2
    
    if (totalGames === 0) {
      // If no games to compare, give it the middle of the range
      return (minScore + maxScore) / 2;
    }
    
    // Calculate position within the star category
    // Position 0 (best) gets maxScore, position last gets minScore
    // For position at end (worst), use totalGames as position
    const normalizedPosition = position === totalGames ? totalGames : position;
    const score = maxScore - (normalizedPosition / totalGames) * range;
    
    // Clamp between 0 and 10 to ensure it never goes outside bounds
    return Math.max(0, Math.min(10, score));
  };

  const handleGameChoice = (preferredGame) => {
    const currentGame = gamesToCompare[currentComparisonIndex];
    
    // Record the comparison
    const comparison = {
      newGameBetter: preferredGame === 'new',
      comparedGame: currentGame,
      index: currentComparisonIndex,
    };
    
    setComparisonHistory([...comparisonHistory, comparison]);
    
    // Move to next game or finish
    if (currentComparisonIndex < gamesToCompare.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1);
    } else {
      // All comparisons done, calculate position and save
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
    // Skip this comparison and move to next
    if (currentComparisonIndex < gamesToCompare.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1);
    } else {
      // If last game, finish with current position
      finishComparison();
    }
  };

  const handleSkip = () => {
    // Close modal and save at end position
    finishComparisonAtEnd();
  };

  const handleCancelComparison = () => {
    setComparisonModal(false);
    setSelectedGame(null);
    setSelectedStarRating(0);
    setCurrentComparisonIndex(0);
    setComparisonHistory([]);
    setGamesToCompare([]);
  };

  const finishComparison = async () => {
    // Calculate position based on comparison history
    let position = gamesToCompare.length;
    
    // Find the first game where new game is better
    for (let i = 0; i < comparisonHistory.length; i++) {
      if (comparisonHistory[i].newGameBetter) {
        position = comparisonHistory[i].index;
        break;
      }
    }

    // Calculate numerical rating based on position
    const numericalRating = calculateRating(position, gamesToCompare.length, selectedStarRating);
    await saveComparisonResult(numericalRating);
  };

  const finishComparisonAtEnd = async () => {
    // Save at the end (worst position)
    const numericalRating = calculateRating(gamesToCompare.length, gamesToCompare.length, selectedStarRating);
    await saveComparisonResult(numericalRating);
  };

  const saveComparisonResult = async (numericalRating) => {

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, sign out and redirect to login
      if (!user || authError) {
        await supabase.auth.signOut();
        return;
      }

      // Clamp rating between 0 and 10
      const clampedRating = Math.max(0, Math.min(10, numericalRating));

      const { data, error } = await rankingsService.addRanking(user.id, {
        name: selectedGame.name,
        genre: selectedGame.genre || 'Unknown',
        rating: clampedRating.toFixed(2),
        starRating: selectedStarRating,
      });

      if (error) {
        // If error is due to authentication, sign out
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        Alert.alert('Error', error.message || 'Failed to save game');
        console.error(error);
        return;
      }

      // Reload games to update the list
      await loadExistingGames();
      
      // Reset all comparison state
      setComparisonModal(false);
      setStarRatingModal(false);
      setSelectedGame(null);
      setSelectedStarRating(0);
      setCurrentComparisonIndex(0);
      setComparisonHistory([]);
      setGamesToCompare([]);
      setGameName('');
      setGameGenre('');
      setSearchQuery('');
      setShowSearchResults(false);
      
      Alert.alert('Success', 'Game ranked successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      // If error is due to authentication, sign out
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        await supabase.auth.signOut();
        return;
      }
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
  };

  const handleSelectGame = (game) => {
    setGameName(game.name);
    setGameGenre(game.genre);
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Immediately show star rating modal
    setSelectedGame({
      name: game.name,
      genre: game.genre,
    });
    setStarRatingModal(true);
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
        <Text style={styles.title}>Rank a New Game</Text>
        <Text style={styles.subtitle}>
          Add a game to your ranking list
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Search for a Game *</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search games... (e.g., Zelda, Witcher, Elden Ring)"
              placeholderTextColor="#95a5a6"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.name}-${index}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectGame(item)}
                  >
                    <GameImage 
                      gameName={item.name}
                      style={styles.searchResultImage}
                      resizeMode="cover"
                    />
                    <View style={styles.searchResultTextContainer}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultGenre}>{item.genre}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.noResultsText}>No games found</Text>
              </View>
            )}
          </View>
        </View>
      </View>

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

            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((stars) => (
                <TouchableOpacity
                  key={stars}
                  style={styles.starButton}
                  onPress={() => handleStarRatingSelect(stars)}
                >
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        style={[
                          styles.star,
                          star <= stars && styles.starFilled,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.starLabel}>{stars} {stars === 1 ? 'Star' : 'Stars'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setStarRatingModal(false);
                setSelectedGame(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        visible={comparisonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setComparisonModal(false);
          setSelectedGame(null);
          setSelectedStarRating(0);
          setCurrentComparisonIndex(0);
          setComparisonHistory([]);
          setGamesToCompare([]);
        }}
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

            {/* Side by Side Comparison */}
            <View style={styles.sideBySideContainer}>
              {/* New Game (Left) */}
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

              {/* Existing Game (Right) */}
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

            {/* Action Buttons */}
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
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#b2bec3',
    marginBottom: 30,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2d3436',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  button: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#b2bec3',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  comparisonItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  comparisonGameName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  comparisonGameNameCenter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  comparisonText: {
    color: '#74b9ff',
    fontSize: 12,
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
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2d3436',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#636e72',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1a1a2e',
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultGenre: {
    color: '#74b9ff',
    fontSize: 14,
  },
  noResultsText: {
    color: '#95a5a6',
    fontSize: 14,
    padding: 15,
    textAlign: 'center',
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: '#1a1a2e',
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
  starDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  starSmall: {
    fontSize: 18,
    color: '#636e72',
    marginHorizontal: 2,
  },
  newGameCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6c5ce7',
    alignItems: 'center',
  },
  newGameLabel: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  comparisonGameGenre: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonInstruction: {
    color: '#74b9ff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  comparisonProgress: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
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
  comparisonCardLabel: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  vsText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
  ratingScore: {
    color: '#fdcb6e',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  centeredButtonText: {
    textAlign: 'center',
  },
});

