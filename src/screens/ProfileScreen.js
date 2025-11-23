import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService, profileService } from '../services/supabaseService';
import APIUsageDisplay from '../components/APIUsageDisplay';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [rankings, setRankings] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
    loadRankings();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user or auth error, sign out and redirect to login
      if (!user || authError) {
        await supabase.auth.signOut();
        return;
      }

      const { data: profile, error } = await profileService.getProfile(user.id);
      
      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          await supabase.auth.signOut();
          return;
        }
        console.error('Error loading profile:', error);
        // Use auth user data as fallback
        setUserData({
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          email: user.email,
        });
        return;
      }

      setUserData({
        username: profile.username,
        email: profile.email || user.email,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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

  const handleShareRankings = async () => {
    if (rankings.length === 0) {
      Alert.alert('No Rankings', 'You need to rank some games first!');
      return;
    }

    const shareText = `My Top ${rankings.length} Video Games:\n\n` +
      rankings.map((game, index) => 
        `${index + 1}. ${game.name}${game.rating ? ` (${Math.max(0, Math.min(10, parseFloat(game.rating))).toFixed(1)})` : ''}`
      ).join('\n') +
      `\n\nRanked on GameRank 🎮`;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync({
          message: shareText,
        });
      } else {
        Alert.alert('Sharing', shareText);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share rankings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // Navigation will be handled by App.js auth state change
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>
            {userData?.username || 'User'}
          </Text>
          <Text style={styles.email}>{userData?.email || ''}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{rankings.length}</Text>
            <Text style={styles.statLabel}>Games Ranked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {rankings.length > 0
                ? (rankings.reduce((sum, g) => sum + Math.max(0, Math.min(10, parseFloat(g.rating || 0))), 0) /
                    rankings.length).toFixed(1)
                : '0'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareRankings}
          >
            <Text style={styles.actionButtonText}>Share My Rankings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              View All Rankings
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Games</Text>
          {rankings.slice(0, 5).map((game, index) => (
            <View key={game.id} style={styles.topGameItem}>
              <Text style={styles.topGameRank}>#{index + 1}</Text>
              <View style={styles.topGameInfo}>
                <Text style={styles.topGameName}>{game.name}</Text>
                <Text style={styles.topGameGenre}>{game.genre}</Text>
              </View>
              {game.rating && (
                <Text style={styles.topGameRating}>{Math.max(0, Math.min(10, parseFloat(game.rating))).toFixed(1)}</Text>
              )}
            </View>
          ))}
          {rankings.length === 0 && (
            <Text style={styles.emptyText}>No games ranked yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <APIUsageDisplay />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#95a5a6',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 20,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6c5ce7',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#b2bec3',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  secondaryButtonText: {
    color: '#6c5ce7',
  },
  topGameItem: {
    flexDirection: 'row',
    backgroundColor: '#2d3436',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  topGameRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c5ce7',
    width: 40,
  },
  topGameInfo: {
    flex: 1,
  },
  topGameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  topGameGenre: {
    fontSize: 12,
    color: '#95a5a6',
  },
  topGameRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00b894',
  },
  emptyText: {
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#d63031',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

