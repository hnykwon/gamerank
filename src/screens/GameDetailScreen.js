import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function GameDetailScreen({ route }) {
  const { game } = route.params || {};

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.genre}>{game.genre || 'Unknown Genre'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Rating:</Text>
            <Text style={styles.value}>
              {game.rating ? `${game.rating}/10` : 'Not rated'}
            </Text>
          </View>

          {game.dateAdded && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date Added:</Text>
              <Text style={styles.value}>
                {new Date(game.dateAdded).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Details</Text>
          <Text style={styles.description}>
            This game is part of your personal ranking list. You can compare it
            with other games you've ranked to see how it stacks up!
          </Text>
        </View>
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
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#636e72',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  genre: {
    fontSize: 18,
    color: '#95a5a6',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3436',
  },
  label: {
    fontSize: 16,
    color: '#b2bec3',
  },
  value: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#b2bec3',
    lineHeight: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});

