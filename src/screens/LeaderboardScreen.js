import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import AppHeader from '../components/AppHeader';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Coming Soon</Text>
        <Text style={styles.emptySubtext}>
          Leaderboard features will be available here
        </Text>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Raleway',
    color: '#000',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Raleway',
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
});


