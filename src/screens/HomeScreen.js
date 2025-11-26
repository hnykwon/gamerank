import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService } from '../services/supabaseService';
import AppHeader from '../components/AppHeader';

export default function HomeScreen() {
  const [rankings, setRankings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadRankings();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('rankings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_rankings' },
        () => {
          loadRankings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRankings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, sign out and redirect to login
      if (!user || authError) {
        await supabase.auth.signOut();
        setRankings([]);
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
        setRankings([]);
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

      setRankings(transformedData);
    } catch (error) {
      console.error('Error loading rankings:', error);
      setRankings([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRankings();
    setRefreshing(false);
  };

  const renderRankingItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.rankingItem}
      onPress={() => navigation.navigate('GameDetail', { game: item })}
    >
      <Text style={styles.rankText}>{index + 1}</Text>
      <View style={styles.gameInfo}>
        <Text style={styles.gameName}>{item.game_name || item.name}</Text>
        <Text style={styles.gameGenre}>{item.genre || 'Unknown Genre'}</Text>
      </View>
      {item.rating && (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{Math.max(0, Math.min(10, parseFloat(item.rating || 0))).toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader />
      {rankings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No games ranked yet</Text>
          <Text style={styles.emptySubtext}>
            Start ranking games to build your list!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Rank')}
          >
            <Text style={styles.emptyButtonText}>Rank Your First Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rankings}
          renderItem={renderRankingItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
        />
      )}
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
  list: {
    padding: 15,
    paddingTop: 20,
  },
  rankingItem: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
    color: '#001f3f',
    width: 40,
    marginRight: 0,
  },
  gameInfo: {
    flex: 1,
    marginRight: 80,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 3,
  },
  gameGenre: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
  },
  ratingBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#001f3f',
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
});

