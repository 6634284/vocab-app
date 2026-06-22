import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Word } from '../types';

interface WordCardProps {
  word: Word;
  isFlipped: boolean;
  onPress: () => void;
}

export function WordCard({ word, isFlipped, onPress }: WordCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Front */}
        <Animated.View style={[styles.card, { opacity: frontOpacity }]}>
          <Text style={styles.wordText}>{word.word}</Text>
          <Text style={styles.phoneticText}>{word.phonetic}</Text>
          <View style={styles.eyeIconContainer}>
            <MaterialIcons name="visibility" size={22} color="#005ea1" />
          </View>
          <Text style={styles.hintText}>点击显示释义</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.backCard, { opacity: backOpacity }]}>
          <Text style={styles.wordText}>{word.word}</Text>
          <Text style={styles.phoneticText}>{word.phonetic}</Text>
          <View style={styles.divider} />
          <Text style={styles.meaningText}>{word.meaning}</Text>
          {word.example ? (
            <Text style={styles.exampleText}>{word.example}</Text>
          ) : null}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cardContainer: {
    width: '100%',
    height: 400,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005ea1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(193,199,210,0.15)',
  },
  backCard: {},
  wordText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#191c1e',
    marginBottom: 8,
    letterSpacing: -0.02,
  },
  phoneticText: {
    fontSize: 16,
    color: '#717782',
    marginBottom: 32,
  },
  eyeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(0,94,161,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#c1c7d2',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#e6e8eb',
    marginVertical: 20,
  },
  meaningText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#191c1e',
    textAlign: 'center',
    lineHeight: 26,
  },
  exampleText: {
    fontSize: 14,
    color: '#717782',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
