import { supabase } from '../config/supabase';

// Authentication functions
export const authService = {
  // Sign up a new user
  async signUp(email, password, username) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: username,
              email: email,
            },
          ])
          .select();
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Get user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },
};

// Game rankings functions
export const rankingsService = {
  // Get all rankings for current user
  async getUserRankings(userId) {
    try {
      const { data, error } = await supabase
        .from('game_rankings')
        .select('*')
        .eq('user_id', userId)
        .order('rating', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Add a new game ranking
  async addRanking(userId, game) {
    try {
      const { data, error } = await supabase
        .from('game_rankings')
        .insert([
          {
            user_id: userId,
            game_name: game.name,
            genre: game.genre || 'Unknown',
            rating: parseFloat(game.rating),
            star_rating: game.starRating || 0,
            notes: game.notes || null,
            date_added: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update a game ranking
  async updateRanking(rankingId, updates) {
    try {
      const { data, error } = await supabase
        .from('game_rankings')
        .update(updates)
        .eq('id', rankingId)
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete a game ranking
  async deleteRanking(rankingId) {
    try {
      const { error } = await supabase
        .from('game_rankings')
        .delete()
        .eq('id', rankingId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get public rankings (for discover/explore)
  async getPublicRankings(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('game_rankings')
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get average ratings for all games (aggregated from all users)
  async getAverageRatings() {
    try {
      const { data, error } = await supabase
        .from('game_rankings')
        .select('game_name, rating, genre')
        .not('rating', 'is', null);

      if (error) throw error;

      // Calculate average rating per game
      const gameRatings = {};
      data.forEach(item => {
        const gameName = item.game_name;
        if (!gameRatings[gameName]) {
          gameRatings[gameName] = {
            name: gameName,
            genre: item.genre,
            ratings: [],
            averageRating: 0,
            count: 0,
          };
        }
        gameRatings[gameName].ratings.push(parseFloat(item.rating));
        gameRatings[gameName].count++;
      });

      // Calculate averages
      const averages = Object.values(gameRatings).map(game => ({
        name: game.name,
        genre: game.genre,
        averageRating: game.ratings.reduce((sum, r) => sum + r, 0) / game.ratings.length,
        ratingCount: game.count,
      }));

      return { data: averages, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Profile functions
export const profileService = {
  // Get user profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Search users by username
  async searchUsers(query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .ilike('username', `%${query}%`)
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Follower/Following functions
export const followService = {
  // Follow a user
  async followUser(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .insert([
          {
            follower_id: followerId,
            following_id: followingId,
          },
        ])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Unfollow a user
  async unfollowUser(followerId, followingId) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Check if user is following another user
  async isFollowing(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { data: !!data, error: null };
    } catch (error) {
      return { data: false, error };
    }
  },

  // Get users that a user is following
  async getFollowing(userId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id (
            id,
            username,
            email
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get users that follow a user
  async getFollowers(userId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            username,
            email
          )
        `)
        .eq('following_id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get rankings from users that the current user follows
  async getFollowedUsersRankings(followerId, limit = 50) {
    try {
      // First get the list of users being followed
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', followerId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        return { data: [], error: null };
      }

      const followingIds = followsData.map(f => f.following_id);

      // Then get rankings from those users
      const { data, error } = await supabase
        .from('game_rankings')
        .select(`
          *,
          profiles:user_id (
            id,
            username
          )
        `)
        .in('user_id', followingIds)
        .order('date_added', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

