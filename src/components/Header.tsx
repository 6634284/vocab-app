import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <Text style={styles.title}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#005ea1',
    textAlign: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#f7f9fc',
  },
});
