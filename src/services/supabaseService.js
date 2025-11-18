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
};

