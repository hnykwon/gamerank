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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService, gamesService } from '../services/supabaseService';
import { getAllGames } from '../services/gameDatabaseService';
import { gameList as fallbackGameList } from '../data/gameList';
import GameImage from '../components/GameImage';
import AppHeader from '../components/AppHeader';
import { useGameRanking } from '../hooks/useGameRanking';
import GameRankingModals from '../components/GameRankingModals';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [averageRatings, setAverageRatings] = useState({});
  const [loading, setLoading] = useState(true);
  
  const ranking = useGameRanking(async () => {
    await loadMyRankings();
    await loadAllGames();
  });
  
  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [starFilter, setStarFilter] = useState(0); // 0 = All, 1-5 = star ranges
  const [rankedFilter, setRankedFilter] = useState('unranked'); // 'all', 'ranked', 'unranked'
  const [priceFilter, setPriceFilter] = useState(0); // 0 = All, 1 = $, 2 = $$, 3 = $$$, 4 = $$$$
  const [sortBy, setSortBy] = useState('name'); // 'name', 'rating', 'genre'
  const [openDropdown, setOpenDropdown] = useState(null); // 'genre', 'rating', 'ranked', 'price', 'sort', or null
  
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
      // Try to fetch games from database first
      const { data: dbGames, error: dbError } = await gamesService.getAllGames();
      
      if (dbGames && dbGames.length > 0 && !dbError) {
        // Use games from database (includes all metadata: name, genre, image, price)
        console.log(`✅ Loaded ${dbGames.length} games from database`);
        const gamesWithIds = dbGames.map((game, index) => ({
          id: game.id || game.rawg_id || `db-game-${index}`,
          name: game.name,
          genre: game.genre || 'Unknown',
          imageUrl: game.image_url || null,
          price: game.price || null,
        }));
        
        setAllGames(gamesWithIds);
        return;
      }
      
      // Fallback: If database is empty or error, fetch from RAWG API
      console.log('⚠️  Database empty or error, fetching from RAWG API...');
      const games = await getAllGames();
      
      // Get game names to fetch from database (for prices)
      const gameNames = games.map(g => g.name);
      
      // Fetch prices from database
      const { data: priceGames, error: priceError } = await gamesService.getGamesByNames(gameNames);
      
      // Create a map of game names to prices from database
      const priceMap = {};
      if (priceGames && !priceError) {
        priceGames.forEach(dbGame => {
          priceMap[dbGame.name] = dbGame.price;
        });
      }
      
      // Add unique IDs for FlatList and ensure proper format
      const gamesWithIds = games.map((game, index) => ({
        id: game.id || `game-${index}`,
        name: game.name,
        genre: game.genre || 'Unknown',
        imageUrl: game.imageUrl || null,
        price: priceMap[game.name] || null, // Price from database, or null if not found
      }));
      
      setAllGames(gamesWithIds);
    } catch (error) {
      console.error('Error loading games:', error);
      // Final fallback to local list
      const gameNames = fallbackGameList.map(g => g.name);
      
      // Try to fetch prices from database for fallback games
      let priceMap = {};
      try {
        const { data: dbGames } = await gamesService.getGamesByNames(gameNames);
        if (dbGames) {
          dbGames.forEach(dbGame => {
            priceMap[dbGame.name] = dbGame.price;
          });
        }
      } catch (dbError) {
        console.warn('Error fetching prices from database:', dbError);
      }
      
      const gamesWithIds = fallbackGameList.map((game, index) => ({
        id: `game-${index}`,
        name: game.name,
        genre: game.genre,
        imageUrl: game.imageUrl || null,
        price: priceMap[game.name] || null,
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

  const getPriceCategory = (price) => {
    if (!price || price === null || price === undefined) return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return null;
    if (numPrice < 20) return 1; // $
    if (numPrice < 40) return 2; // $$
    if (numPrice < 60) return 3; // $$$
    return 4; // $$$$
  };

  const handleAddGame = (game) => {
    ranking.startRanking({
      name: game.name,
      genre: game.genre || 'Unknown',
      price: game.price || null,
    });
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

      // Rating filter - filter by star range
      if (starFilter > 0) {
        const gameAvgRating = averageRatings[game.name]?.averageRating || 0;
        // Star ranges: 1 star = 0-2, 2 stars = 2-4, 3 stars = 4-6, 4 stars = 6-8, 5 stars = 8-10
        const minRating = (starFilter - 1) * 2;
        const maxRating = starFilter * 2;
        // For 5 stars, include 10 (maxRating), for others exclude maxRating
        if (starFilter === 5) {
          if (gameAvgRating < minRating || gameAvgRating > maxRating) {
            return false;
          }
        } else {
          if (gameAvgRating < minRating || gameAvgRating >= maxRating) {
            return false;
          }
        }
      }

      // Ranked filter
      if (rankedFilter !== 'all') {
        const isRanked = isGameRanked(game.name);
        if (rankedFilter === 'ranked' && !isRanked) {
          return false;
        }
        if (rankedFilter === 'unranked' && isRanked) {
          return false;
        }
      }

      // Price filter
      if (priceFilter > 0) {
        const gamePrice = game.price || null;
        const priceCategory = getPriceCategory(gamePrice);
        if (priceCategory !== priceFilter) {
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
    const priceCategory = getPriceCategory(item.price);
    const priceDisplay = priceCategory ? '$'.repeat(priceCategory) : '?';
    
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
          <Text style={styles.gameGenre}>{priceDisplay} | {item.genre}</Text>
          <Text style={styles.avgRatingText}>
            User Avg: <Text style={styles.avgRatingValue}>{avgRating ? avgRating.averageRating.toFixed(1) : 'N/A'}</Text>
          </Text>
        </View>
        {ranked ? (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => handleAddGame(item)}
          >
            <Ionicons name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => handleAddGame(item)}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
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
          style={[styles.filterChip, styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
        >
          <Text style={styles.filterChipTextActive}>
            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'rating' ? 'Rating' : 'Genre'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, rankedFilter !== 'all' && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'ranked' ? null : 'ranked')}
        >
          <Text style={[styles.filterChipText, rankedFilter !== 'all' && styles.filterChipTextActive]}>
            Ranked: {rankedFilter === 'all' ? 'All' : rankedFilter === 'ranked' ? 'Ranked' : 'Unranked'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedGenre !== 'All' && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}
        >
          <Text style={[styles.filterChipText, selectedGenre !== 'All' && styles.filterChipTextActive]}>
            Genre: {selectedGenre}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, starFilter > 0 && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
        >
          <Text style={[styles.filterChipText, starFilter > 0 && styles.filterChipTextActive]}>
            Avg Rating: {starFilter === 0 ? 'All' : '★'.repeat(starFilter)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, priceFilter > 0 && styles.filterChipActive]}
          onPress={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
        >
          <Text style={[styles.filterChipText, priceFilter > 0 && styles.filterChipTextActive]}>
            Price: {priceFilter === 0 ? 'All' : '$'.repeat(priceFilter)}
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
            <Text style={styles.dropdownTitle}>Filter by Avg Rating</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingButtons}>
            {[0, 1, 2, 3, 4, 5].map((stars) => (
              <TouchableOpacity
                key={stars}
                style={[
                  styles.ratingButton,
                  starFilter === stars && styles.ratingButtonActive,
                ]}
                onPress={() => {
                  setStarFilter(stars);
                  setOpenDropdown(null);
                }}
              >
                {stars === 0 ? (
                  <Text
                    style={[
                      styles.ratingButtonText,
                      starFilter === stars && styles.ratingButtonTextActive,
                    ]}
                  >
                    All Ratings
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.ratingStarText,
                      starFilter === stars && styles.ratingStarTextActive,
                    ]}
                  >
                    {'★'.repeat(stars)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Price Dropdown Bubble */}
      {openDropdown === 'price' && (
        <View style={styles.dropdownBubble}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Filter by Price</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingButtons}>
            {[
              { value: 0, label: 'All Prices', symbol: 'All' },
              { value: 1, label: '$0-$20', symbol: '$' },
              { value: 2, label: '$20-$40', symbol: '$$' },
              { value: 3, label: '$40-$60', symbol: '$$$' },
              { value: 4, label: '$60+', symbol: '$$$$' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingButton,
                  priceFilter === option.value && styles.ratingButtonActive,
                ]}
                onPress={() => {
                  setPriceFilter(option.value);
                  setOpenDropdown(null);
                }}
              >
                {option.value === 0 ? (
                  <Text
                    style={[
                      styles.ratingButtonText,
                      priceFilter === option.value && styles.ratingButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.priceSymbolText,
                      priceFilter === option.value && styles.priceSymbolTextActive,
                    ]}
                  >
                    {option.symbol}
                  </Text>
                )}
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

      {/* Ranked Dropdown Bubble */}
      {openDropdown === 'ranked' && (
        <View style={styles.dropdownBubble}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Filter by Ranked Status</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
              <Text style={styles.dropdownClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sortButtons}>
            {[
              { value: 'all', label: 'All Games' },
              { value: 'ranked', label: 'Ranked Only' },
              { value: 'unranked', label: 'Unranked Only' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  rankedFilter === option.value && styles.sortButtonActive,
                ]}
                onPress={() => {
                  setRankedFilter(option.value);
                  setOpenDropdown(null);
                }}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    rankedFilter === option.value && styles.sortButtonTextActive,
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
          <ActivityIndicator size="large" color="#001f3f" />
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
  filterButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#001f3f',
    borderColor: '#001f3f',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownBubble: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  dropdownClose: {
    color: '#666',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genreButtonActive: {
    backgroundColor: '#001f3f',
    borderColor: '#001f3f',
  },
  genreButtonText: {
    color: '#666',
    fontSize: 14,
  },
  genreButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  moreGenresText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Raleway',
    marginTop: 5,
    fontStyle: 'italic',
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#001f3f',
    borderColor: '#001f3f',
  },
  ratingButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
  ratingButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingStarText: {
    color: '#ddd',
    fontSize: 24,
    fontFamily: 'Raleway',
  },
  ratingStarTextActive: {
    color: '#001f3f',
  },
  priceSymbolText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  priceSymbolTextActive: {
    color: '#fff',
  },
  sortButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#001f3f',
    borderColor: '#001f3f',
  },
  sortButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avgRatingText: {
    color: '#001f3f',
    fontSize: 12,
    fontFamily: 'Raleway',
    marginTop: 4,
  },
  avgRatingValue: {
    fontWeight: 'bold',
  },
  list: {
    padding: 15,
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
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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

