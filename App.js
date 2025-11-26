import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Raleway_400Regular, Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { supabase } from './src/config/supabase';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import RankScreen from './src/screens/RankScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import GameDetailScreen from './src/screens/GameDetailScreen';
import SocialFeedScreen from './src/screens/SocialFeedScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#001f3f',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="SocialFeed" 
        component={SocialFeedScreen}
        options={{ title: 'Social Feed' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Your Lists' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load fonts
  // Playfair Display SC is used for the "Cartridge" logo text
  const [fontsLoaded] = useFonts({
    'Raleway': Raleway_400Regular,
    'Raleway-SemiBold': Raleway_600SemiBold,
    'Raleway-Bold': Raleway_700Bold,
    'PlayfairDisplaySC-Regular': require('./assets/fonts/PlayfairDisplaySC-Regular.ttf'),
    'PlayfairDisplaySC-Bold': require('./assets/fonts/PlayfairDisplaySC-Bold.ttf'),
  });

  useEffect(() => {
    checkAuth();

    // Listen for auth changes (including sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      // If user signed out or session expired, redirect to login
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!session);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" options={{ animationEnabled: false }}>
            {props => <AuthScreen {...props} onAuthSuccess={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="GameDetail" 
              component={GameDetailScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#000',
              }}
            />
            <Stack.Screen 
              name="Rank" 
              component={RankScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#000',
                title: 'Rank a New Game',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

