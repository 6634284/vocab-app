import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getWordsByBook, searchWords, getCardByWordId } from '../../src/db/queries';
import { Word } from '../../src/types';

export default function BookDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [words, setWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'learned' | 'new'>('all');

  useEffect(() => {
    if (id) loadWords();
  }, [id]);

  const loadWords = async () => {
    if (!id) return;
    try {
      const data = await getWordsByBook(db, id);
      setWords(data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!id) return;
    if (query.trim() === '') {
      loadWords();
      return;
    }
    try {
      const results = await searchWords(db, id, query);
      setWords(results);
    } catch (error) {
      console.error('Failed to search:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索单词..."
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={words}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.wordCard}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordText}>{item.word}</Text>
              <Text style={styles.phoneticText}>{item.phonetic}</Text>
            </View>
            <Text style={styles.meaningText}>{item.meaning}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? '未找到匹配的单词' : '暂无单词'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    gap: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  phoneticText: {
    fontSize: 14,
    color: '#6C757D',
  },
  meaningText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
  },
});
