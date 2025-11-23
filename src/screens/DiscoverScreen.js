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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService } from '../services/supabaseService';
import { getAllGames } from '../services/gameDatabaseService';
import { gameList as fallbackGameList } from '../data/gameList';
import GameImage from '../components/GameImage';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [averageRatings, setAverageRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [starRatingModal, setStarRatingModal] = useState(false);
  const [comparisonModal, setComparisonModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStarRating, setSelectedStarRating] = useState(0);
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [gamesToCompare, setGamesToCompare] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesModal, setNotesModal] = useState(false);
  
  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'rating', 'genre'
  const [openDropdown, setOpenDropdown] = useState(null); // 'genre', 'rating', 'sort', or null
  
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAllGames(), loadMyRankings(), loadAverageRatings()]);
    setLoading(false);
  };

  const loadAverageRatings = async () => {
    try {
      const { data, error } = await rankingsService.getAverageRatings();
      if (error) {
        console.error('Error loading average ratings:', error);
        return;
      }
      
      // Convert to map for easy lookup
      const ratingMap = {};
      (data || []).forEach(game => {
        ratingMap[game.name] = {
          averageRating: game.averageRating,
          ratingCount: game.ratingCount,
        };
      });
      setAverageRatings(ratingMap);
    } catch (error) {
      console.error('Error loading average ratings:', error);
    }
  };

  const loadAllGames = async () => {
    try {
      // Fetch games from RAWG.io API
      const games = await getAllGames();
      
      // Add unique IDs for FlatList and ensure proper format
      const gamesWithIds = games.map((game, index) => ({
        id: game.id || `game-${index}`,
        name: game.name,
        genre: game.genre || 'Unknown',
        imageUrl: game.imageUrl || null,
      }));
      
      setAllGames(gamesWithIds);
    } catch (error) {
      console.error('Error loading games:', error);
      // Fallback to local list
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
    // Show star rating modal immediately
    setSelectedGame({
      name: game.name,
      genre: game.genre || 'Unknown',
    });
    setStarRatingModal(true);
  };

  const handleStarRatingSelect = (stars) => {
    setSelectedStarRating(stars);
    setStarRatingModal(false);
    
    // Get games with the same star rating, sorted by rating
    const gamesInSameCategory = myRankings
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

      // Clamp rating between 0 and 10
      const rating = Math.max(0, Math.min(10, parseFloat(game.rating || '0')));

      const { data, error } = await rankingsService.addRanking(user.id, {
        name: game.name,
        genre: game.genre || 'Unknown',
        rating: rating.toFixed(2),
        starRating: game.starRating || 0,
        notes: game.notes || null,
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

      // Reload rankings to update the list
      await loadMyRankings();
      await loadAllGames(); // Refresh to show updated ranked status
      
      // Reset state
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
    // Ensure position is within valid range
    const normalizedPosition = Math.max(0, Math.min(totalGames, position));
    const score = maxScore - (normalizedPosition / totalGames) * range;
    
    // Clamp between 0 and 10 to ensure it never goes outside bounds
    // Also ensure it stays within the star category bounds
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

      // Clamp rating between 0 and 10
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

  // Get unique genres from all games
  const availableGenres = ['All', ...new Set(allGames.map(g => g.genre).filter(Boolean))].sort();

  const filteredGames = allGames
    .filter((game) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          game.name.toLowerCase().includes(query) ||
          (game.genre && game.genre.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Genre filter
      if (selectedGenre !== 'All' && game.genre !== selectedGenre) {
        return false;
      }

      // Rating filter - filter by average user rating
      if (minRating > 0) {
        const gameAvgRating = averageRatings[game.name]?.averageRating || 0;
        if (gameAvgRating < minRating) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'rating') {
        const ratingA = averageRatings[a.name]?.averageRating || 0;
        const ratingB = averageRatings[b.name]?.averageRating || 0;
        return ratingB - ratingA; // Descending (highest first)
      } else if (sortBy === 'genre') {
        const genreA = a.genre || 'Unknown';
        const genreB = b.genre || 'Unknown';
        return genreA.localeCompare(genreB);
      }
      return 0;
    });

  const renderGameItem = ({ item }) => {
    const ranked = isGameRanked(item.name);
    const avgRating = averageRatings[item.name];
    
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
          {avgRating && (
            <Text style={styles.avgRatingText}>
              Avg: {avgRating.averageRating.toFixed(1)} ({avgRating.ratingCount} {avgRating.ratingCount === 1 ? 'rating' : 'ratings'})
            </Text>
          )}
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

      {/* Filter Buttons Row */}
      <View style={styles.filterButtonsRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedGenre !== 'All' && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}
        >
          <Text style={[styles.filterChipText, selectedGenre !== 'All' && styles.filterChipTextActive]}>
            Genre: {selectedGenre}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, minRating > 0 && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
        >
          <Text style={[styles.filterChipText, minRating > 0 && styles.filterChipTextActive]}>
            Rating: {minRating === 0 ? 'All' : `${minRating}+`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
        >
          <Text style={styles.filterChipTextActive}>
            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'rating' ? 'Rating' : 'Genre'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Genre Dropdown Bubble */}
      {openDropdown === 'genre' && (
        <View style={styles.dropdownBubble}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Select Genre</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.genreScrollView} nestedScrollEnabled={true}>
            <View style={styles.genreButtons}>
              {availableGenres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreButton,
                    selectedGenre === genre && styles.genreButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setOpenDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.genreButtonText,
                      selectedGenre === genre && styles.genreButtonTextActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Rating Dropdown Bubble */}
      {openDropdown === 'rating' && (
        <View style={styles.dropdownBubble}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Min Average Rating</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingButtons}>
            {[0, 2, 4, 6, 8].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  minRating === rating && styles.ratingButtonActive,
                ]}
                onPress={() => {
                  setMinRating(rating);
                  setOpenDropdown(null);
                }}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    minRating === rating && styles.ratingButtonTextActive,
                  ]}
                >
                  {rating === 0 ? 'All Ratings' : `${rating}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sort Dropdown Bubble */}
      {openDropdown === 'sort' && (
        <View style={styles.dropdownBubble}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sortButtons}>
            {[
              { value: 'name', label: 'Name' },
              { value: 'rating', label: 'Average Rating' },
              { value: 'genre', label: 'Genre' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  sortBy === option.value && styles.sortButtonActive,
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setOpenDropdown(null);
                }}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option.value && styles.sortButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
  filterButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#16213e',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  filterChipActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  filterChipText: {
    color: '#b2bec3',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownBubble: {
    backgroundColor: '#2d3436',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#636e72',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownClose: {
    color: '#95a5a6',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  genreScrollView: {
    maxHeight: 200,
  },
  genreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreButton: {
    backgroundColor: '#2d3436',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  genreButtonActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  genreButtonText: {
    color: '#b2bec3',
    fontSize: 14,
  },
  genreButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  moreGenresText: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    backgroundColor: '#2d3436',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#636e72',
    minWidth: 60,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#fdcb6e',
    borderColor: '#fdcb6e',
  },
  ratingButtonText: {
    color: '#b2bec3',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingButtonTextActive: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  sortButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#2d3436',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  sortButtonActive: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
  },
  sortButtonText: {
    color: '#b2bec3',
    fontSize: 14,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avgRatingText: {
    color: '#74b9ff',
    fontSize: 12,
    marginTop: 4,
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

