import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { searchGames } from '../services/gameDatabaseService';
import GameImage from '../components/GameImage';
import { useGameRanking } from '../hooks/useGameRanking';
import GameRankingModals from '../components/GameRankingModals';

export default function RankScreen() {
  const [gameName, setGameName] = useState('');
  const [gameGenre, setGameGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  const ranking = useGameRanking(() => {
    setGameName('');
    setGameGenre('');
    setSearchQuery('');
    setShowSearchResults(false);
    navigation.navigate('Home');
  });

  useEffect(() => {
    ranking.loadExistingGames();
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
        const results = await searchGames(searchQuery);
        setSearchResults(results.slice(0, 10));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    performSearch();
  }, [searchQuery]);

  const handleSelectGame = (game) => {
    setGameName(game.name);
    setGameGenre(game.genre);
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Start ranking immediately
    ranking.startRanking({
      name: game.name,
      genre: game.genre,
    });
  };

  const handleCancelStarRating = () => {
    ranking.setStarRatingModal(false);
    ranking.setSelectedGame(null);
    ranking.setSelectedStarRating(0);
    ranking.setNotes('');
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
          onCancelStarRating={handleCancelStarRating}
          setSelectedStarRating={ranking.setSelectedStarRating}
          setNotes={ranking.setNotes}
          setNotesModal={ranking.setNotesModal}
        />
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
    marginRight: 15,
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
});
