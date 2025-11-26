import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { rankingsService } from '../services/supabaseService';

export function useGameRanking(onSuccess) {
  const [starRatingModal, setStarRatingModal] = useState(false);
  const [comparisonModal, setComparisonModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStarRating, setSelectedStarRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [gamesToCompare, setGamesToCompare] = useState([]);
  const [existingGames, setExistingGames] = useState([]);

  // Load existing games for comparison
  const loadExistingGames = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        await supabase.auth.signOut();
        setExistingGames([]);
        return;
      }

      const { data, error } = await rankingsService.getUserRankings(user.id);
      
      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading games:', error);
        setExistingGames([]);
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

      setExistingGames(transformedData);
    } catch (error) {
      console.error('Error loading games:', error);
      setExistingGames([]);
    }
  };

  // Start ranking a game
  const startRanking = (game) => {
    setSelectedGame({
      name: game.name,
      genre: game.genre || 'Unknown',
      price: game.price || null,
    });
    setSelectedStarRating(0);
    setNotes('');
    setStarRatingModal(true);
    loadExistingGames();
  };

  // Handle star rating selection
  const handleStarRatingSelect = (stars) => {
    setSelectedStarRating(stars);
    setStarRatingModal(false);
    
    // Get games with the same star rating, sorted by rating
    const gamesInSameCategory = existingGames
      .filter(game => {
        return game.starRating === stars;
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

  // Calculate rating based on position
  const calculateRating = (position, totalGames, starRating) => {
    // Base score is the minimum for this star category
    // 1 star: 0-2, 2 stars: 2-4, 3 stars: 4-6, 4 stars: 6-8, 5 stars: 8-10
    const baseScore = (starRating - 1) * 2;
    
    if (totalGames === 0) {
      // If no games to compare, use middle of the range
      return baseScore + 1;
    }
    
    // Position offset ranges from 0 to 2 (the width of each star category)
    // position 0 (best) gets offset 2, position totalGames (worst) gets offset 0
    const positionOffset = 2 - (position / totalGames) * 2;
    return baseScore + positionOffset;
  };

  // Handle game choice in comparison
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

  // Handle undo
  const handleUndo = () => {
    if (comparisonHistory.length > 0) {
      const newHistory = comparisonHistory.slice(0, -1);
      setComparisonHistory(newHistory);
      setCurrentComparisonIndex(Math.max(0, currentComparisonIndex - 1));
    }
  };

  // Handle too tough
  const handleTooTough = () => {
    if (currentComparisonIndex < gamesToCompare.length - 1) {
      setCurrentComparisonIndex(currentComparisonIndex + 1);
    } else {
      finishComparison();
    }
  };

  // Handle skip
  const handleSkip = () => {
    finishComparisonAtEnd();
  };

  // Finish comparison
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

  // Finish comparison at end
  const finishComparisonAtEnd = async () => {
    const numericalRating = calculateRating(gamesToCompare.length, gamesToCompare.length, selectedStarRating);
    await saveComparisonResult(numericalRating);
  };

  // Save comparison result
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

      resetState();
      
      if (onSuccess) {
        onSuccess();
      } else {
        Alert.alert('Success', 'Game ranked successfully!');
      }
    } catch (error) {
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        await supabase.auth.signOut();
        return;
      }
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
  };

  // Save game directly (no comparison needed)
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

      resetState();
      
      if (onSuccess) {
        onSuccess();
      } else {
        Alert.alert('Success', 'Game ranked successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save game');
      console.error(error);
    }
  };

  // Reset all state
  const resetState = () => {
    setComparisonModal(false);
    setStarRatingModal(false);
    setNotesModal(false);
    setSelectedGame(null);
    setSelectedStarRating(0);
    setNotes('');
    setCurrentComparisonIndex(0);
    setComparisonHistory([]);
    setGamesToCompare([]);
  };

  // Cancel comparison
  const handleCancelComparison = () => {
    resetState();
  };

  return {
    // State
    starRatingModal,
    comparisonModal,
    notesModal,
    selectedGame,
    selectedStarRating,
    notes,
    currentComparisonIndex,
    comparisonHistory,
    gamesToCompare,
    existingGames,
    
    // Actions
    startRanking,
    handleStarRatingSelect,
    handleGameChoice,
    handleUndo,
    handleTooTough,
    handleSkip,
    handleCancelComparison,
    
    // Setters
    setStarRatingModal,
    setComparisonModal,
    setNotesModal,
    setSelectedStarRating,
    setNotes,
    setSelectedGame,
    
    // Utilities
    loadExistingGames,
  };
}

