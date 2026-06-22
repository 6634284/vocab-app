import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export function ProgressBar({ current, total, color = '#4A90D9' }: ProgressBarProps) {
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.text}>{current} / {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    color: '#6C757D',
    minWidth: 50,
    textAlign: 'right',
  },
});
