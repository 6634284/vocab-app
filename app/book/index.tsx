import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../src/components/Header';
import { getAllBooks, getWordsByBook } from '../../src/db/queries';
import { Book, Word } from '../../src/types';
import { useSettingsStore } from '../../src/stores/useSettingsStore';

export default function BookListPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { selectedBookId, setSelectedBookId } = useSettingsStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const bookData = await getAllBooks(db);
      setBooks(bookData);
      if (selectedBookId) {
        const wordData = await getWordsByBook(db, selectedBookId, 10);
        setWords(wordData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBookId(book.id);
    getWordsByBook(db, book.id, 10).then(setWords);
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#717782" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词..."
            placeholderTextColor="#c1c7d2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Book Cards - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bookScroll}
        >
          {books.map((book) => {
            const isActive = selectedBookId === book.id;
            return (
              <TouchableOpacity
                key={book.id}
                style={[styles.bookCard, isActive && styles.bookCardActive]}
                onPress={() => handleSelectBook(book)}
                activeOpacity={0.8}
              >
                {isActive && (
                  <View style={styles.checkIcon}>
                    <MaterialIcons name="check-circle" size={24} color="#005ea1" />
                  </View>
                )}
                <Text style={[styles.bookName, isActive && styles.bookNameActive]}>
                  {book.name}
                </Text>
                <Text style={[styles.bookCount, isActive && styles.bookCountActive]}>
                  {book.wordCount} 词
                </Text>
                <Text style={[styles.bookDesc, isActive && styles.bookDescActive]}>
                  {book.description || '涵盖核心词汇，适合冲刺阶段强化记忆。'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Word List */}
        <View style={styles.wordSection}>
          <View style={styles.wordHeader}>
            <Text style={styles.wordHeaderTitle}>今日复习任务</Text>
            <View style={styles.wordBadge}>
              <Text style={styles.wordBadgeText}>剩余 {words.length} 词</Text>
            </View>
          </View>
          {words.map((word) => (
            <View key={word.id} style={styles.wordItem}>
              <View style={styles.wordLeft}>
                <Text style={styles.wordText}>{word.word}</Text>
                <Text style={styles.wordPhonetic}>{word.phonetic}</Text>
              </View>
              <Text style={styles.wordMeaning} numberOfLines={1}>{word.meaning}</Text>
            </View>
          ))}
          {words.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push(`/book/${selectedBookId}`)}
            >
              <Text style={styles.viewAllText}>查看全部任务词汇</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fc' },
  loadingText: { fontSize: 16, color: '#717782' },

  // Search
  searchContainer: {
    marginHorizontal: 24, marginTop: 12, marginBottom: 8,
    backgroundColor: '#f2f4f7', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, paddingVertical: 14, fontSize: 17, color: '#191c1e',
  },

  // Book Cards
  bookScroll: {
    paddingHorizontal: 24, gap: 12, paddingBottom: 8,
  },
  bookCard: {
    width: 260, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: '#c1c7d2', backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  bookCardActive: {
    backgroundColor: '#d2e4ff', borderColor: '#005ea1',
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20,
    elevation: 2,
  },
  checkIcon: { position: 'absolute', top: 16, right: 16 },
  bookName: {
    fontSize: 20, fontWeight: '600', color: '#191c1e', marginBottom: 4, paddingRight: 32,
  },
  bookNameActive: { color: '#001c37' },
  bookCount: {
    fontSize: 15, fontWeight: '400', color: '#414751', marginBottom: 8,
  },
  bookCountActive: { color: '#2b78bf', fontWeight: '500' },
  bookDesc: {
    fontSize: 15, fontWeight: '400', color: '#717782', lineHeight: 22,
  },
  bookDescActive: { color: '#414751' },

  // Word List
  wordSection: {
    backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 16, marginTop: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 10,
    elevation: 1, overflow: 'hidden',
  },
  wordHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#eceef1',
  },
  wordHeaderTitle: { fontSize: 15, fontWeight: '500', color: '#414751' },
  wordBadge: {
    backgroundColor: '#d2e4ff', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  wordBadgeText: { fontSize: 12, fontWeight: '500', color: '#005ea1' },
  wordItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#eceef1',
  },
  wordLeft: { flex: 1 },
  wordText: { fontSize: 20, fontWeight: '600', color: '#191c1e', marginBottom: 2 },
  wordPhonetic: { fontSize: 12, fontWeight: '500', color: '#717782' },
  wordMeaning: { fontSize: 15, fontWeight: '400', color: '#414751', maxWidth: '50%', textAlign: 'right' },
  viewAllBtn: { paddingVertical: 16, alignItems: 'center' },
  viewAllText: { fontSize: 15, fontWeight: '500', color: '#005ea1' },
});
