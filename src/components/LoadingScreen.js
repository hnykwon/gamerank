import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/Cartridge Logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.text}>Cartridge</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginRight: 20,
    // Remove any shadow effects
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  text: {
    fontSize: 48,
    fontFamily: 'PlayfairDisplaySC-Bold', // Uses the bold variant of Playfair Display SC
    color: '#000000',
  },
});

