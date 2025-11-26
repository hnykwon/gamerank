import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <Image 
        source={require('../../assets/Cartridge Logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>Cartridge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 4,
    backgroundColor: 'transparent',
    // Remove any shadow effects
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  text: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplaySC-Bold', // Uses the bold variant of Playfair Display SC
    color: '#000000',
  },
});

