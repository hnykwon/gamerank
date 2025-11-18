import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase project credentials
const SUPABASE_URL = 'https://bjviktxcpsolyawrauvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdmlrdHhjcHNvbHlhd3JhdXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTU0MDIsImV4cCI6MjA3ODk5MTQwMn0.QskYqQF-K2qranEM9L5XbL31LmGBv_8F_w6FMZchp6o';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

