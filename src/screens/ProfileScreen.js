import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { rankingsService, profileService, followService } from '../services/supabaseService';
import APIUsageDisplay from '../components/APIUsageDisplay';
import GameImage from '../components/GameImage';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const firstItemRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    loadUserData();
    loadRankings();
    loadFollowerCounts();
    
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

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadRankings();
      loadFollowerCounts();
    }, [])
  );

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
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
        });
        return;
      }

      setUserData({
        username: profile.username,
        email: profile.email || user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
      });

      // Debug logging
      console.log('Profile loaded:', {
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
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

  const loadFollowerCounts = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      const [followersResult, followingResult] = await Promise.all([
        followService.getFollowers(user.id),
        followService.getFollowing(user.id),
      ]);

      if (followersResult.data) {
        setFollowersCount(followersResult.data.length);
      }
      if (followingResult.data) {
        setFollowingCount(followingResult.data.length);
      }
    } catch (error) {
      console.error('Error loading follower counts:', error);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadRankings(), loadFollowerCounts()]);
    setRefreshing(false);
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

  const openSettings = () => {
    setSettingsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSettings = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSettingsVisible(false);
    });
  };

  const handleSettingsLogout = () => {
    closeSettings();
    // Small delay to allow panel to close before showing alert
    setTimeout(() => {
      handleLogout();
    }, 300);
  };

  const handleEditProfile = () => {
    // Placeholder for edit profile functionality
    Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerName}>
          {userData?.first_name && userData?.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : userData?.username || 'User'}
        </Text>
        <TouchableOpacity 
          onPress={openSettings}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#001f3f"
            colors={["#001f3f"]}
            progressViewOffset={60}
          />
        }
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
      >
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
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{rankings.length}</Text>
              <Text style={styles.statLabel}>Ranked</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.buttonsSection]}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareRankings}
            >
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonInverse}
              onPress={handleEditProfile}
            >
              <Text style={styles.actionButtonTextInverse}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.contentTight}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.centeredTitle]}>Favorite Games</Text>
          {rankings.length === 0 ? (
            <Text style={styles.emptyText}>No games ranked yet</Text>
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.panoramaContainer}
            >
              {rankings.slice(0, 10).map((game, index) => {
                // Determine border style based on rank
                const getBorderStyle = () => {
                  if (index === 0) return styles.goldBorder; // 1st place
                  if (index === 1) return styles.silverBorder; // 2nd place
                  if (index === 2) return styles.bronzeBorder; // 3rd place
                  return null; // 4th-10th have no special border
                };

                // Determine text color based on rank
                const getTextColor = () => {
                  return '#000'; // Black for all ranks
                };

                const textColor = getTextColor();

                return (
                  <TouchableOpacity
                    key={game.id}
                    ref={index === 0 ? firstItemRef : null}
                    style={styles.panoramaItem}
                    onLayout={index === 0 ? (event) => {
                      // Measure the first item's position and center it
                      const { x, width } = event.nativeEvent.layout;
                      const itemCenter = x + width / 2;
                      const scrollPosition = itemCenter - SCREEN_WIDTH / 2;
                      // Small delay to ensure ScrollView is ready
                      requestAnimationFrame(() => {
                        scrollViewRef.current?.scrollTo({
                          x: Math.max(0, scrollPosition),
                          animated: false,
                        });
                      });
                    } : undefined}
                    onPress={() => navigation.navigate('GameDetail', { game })}
                  >
                    <View style={[styles.panoramaImageContainer, getBorderStyle()]}>
                      <GameImage 
                        gameName={game.name} 
                        style={styles.panoramaImage}
                        resizeMode="cover"
                      />
                      <View style={styles.panoramaRankBadge}>
                        <Text style={[styles.panoramaRankText, { color: textColor }]}>{index + 1}</Text>
                      </View>
                      {game.rating && (
                        <View style={styles.panoramaRatingBadge}>
                          <Text style={[styles.panoramaRatingText, { color: textColor }]}>
                            {Math.max(0, Math.min(10, parseFloat(game.rating))).toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.panoramaInfo}>
                      <Text style={styles.panoramaGameName} numberOfLines={2}>
                        {game.name}
                      </Text>
                      <Text style={styles.panoramaGameGenre} numberOfLines={1}>
                        {game.genre}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

      {/* Settings Slide-in Panel */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSettings}
      >
        <Pressable style={styles.settingsOverlay} onPress={closeSettings}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.settingsPanel,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <SafeAreaView style={styles.settingsContent}>
                <View style={styles.settingsHeader}>
                  <Text style={styles.settingsTitle}>Settings</Text>
                  <TouchableOpacity
                    onPress={closeSettings}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.settingsList}>
                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={() => {
                      closeSettings();
                      Alert.alert('Account', 'Account settings coming soon!');
                    }}
                  >
                    <Ionicons name="person-outline" size={24} color="#000" />
                    <Text style={styles.settingsItemText}>Account</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={() => {
                      closeSettings();
                      Alert.alert('Notifications', 'Notification settings coming soon!');
                    }}
                  >
                    <Ionicons name="notifications-outline" size={24} color="#000" />
                    <Text style={styles.settingsItemText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={() => {
                      closeSettings();
                      Alert.alert('Privacy', 'Privacy settings coming soon!');
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={24} color="#000" />
                    <Text style={styles.settingsItemText}>Privacy</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={() => {
                      closeSettings();
                      Alert.alert('Help', 'Help & Support coming soon!');
                    }}
                  >
                    <Ionicons name="help-circle-outline" size={24} color="#000" />
                    <Text style={styles.settingsItemText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.settingsDivider} />

                  <TouchableOpacity
                    style={[styles.settingsItem, styles.logoutSettingsItem]}
                    onPress={handleSettingsLogout}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#d63031" />
                    <Text style={[styles.settingsItemText, styles.logoutText]}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
  },
  settingsButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  contentTight: {
    padding: 20,
    paddingTop: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#001f3f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Raleway',
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    minWidth: 60,
    marginHorizontal: 20,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
    color: '#001f3f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  buttonsSection: {
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#666',
    width: '100%',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 15,
  },
  centeredTitle: {
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#001f3f',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '48%',
    marginRight: 5,
  },
  actionButtonInverse: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '48%',
    marginLeft: 5,
    borderWidth: 2,
    borderColor: '#001f3f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  actionButtonTextInverse: {
    color: '#001f3f',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#001f3f',
  },
  secondaryButtonText: {
    color: '#001f3f',
  },
  topGameItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  topGameRank: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
    color: '#001f3f',
    width: 40,
  },
  topGameInfo: {
    flex: 1,
  },
  topGameName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 3,
  },
  topGameGenre: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
  },
  topGameRatingCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGameRating: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
    color: '#000',
  },
  emptyText: {
    color: '#666',
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
    fontFamily: 'Raleway',
  },
  panoramaContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  panoramaItem: {
    marginRight: 15,
    width: 200,
  },
  panoramaImageContainer: {
    width: 200,
    height: 280,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 0,
  },
  goldBorder: {
    borderWidth: 4,
    borderColor: '#FFD700', // Gold
  },
  silverBorder: {
    borderWidth: 4,
    borderColor: '#C0C0C0', // Silver
  },
  bronzeBorder: {
    borderWidth: 4,
    borderColor: '#CD7F32', // Bronze
  },
  panoramaImage: {
    width: '100%',
    height: '100%',
  },
  panoramaRankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  panoramaRankText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
  },
  panoramaRatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#000',
  },
  panoramaRatingText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'ProximaNova-Bold',
  },
  panoramaInfo: {
    paddingHorizontal: 5,
  },
  panoramaGameName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  panoramaGameGenre: {
    fontSize: 12,
    fontFamily: 'Raleway',
    color: '#666',
    textAlign: 'center',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  settingsPanel: {
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 350,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsContent: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  settingsList: {
    flex: 1,
    paddingTop: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#000',
    marginLeft: 15,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  logoutSettingsItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#d63031',
    fontWeight: '600',
  },
});

