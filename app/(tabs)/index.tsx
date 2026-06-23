import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../src/components/Header';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { getTodayStudyQueue, checkIn } from '../../src/services/studyService';
import { initCardsForBook, getTodayStudyLog } from '../../src/db/queries';

export default function HomePage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { selectedBookId, newWordsPerDay } = useSettingsStore();

  const [newCount, setNewCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayNew, setTodayNew] = useState(0);
  const [todayReview, setTodayReview] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await initCardsForBook(db, selectedBookId);
      const queue = await getTodayStudyQueue(db, selectedBookId, newWordsPerDay);
      setNewCount(queue.newWords.length);
      setReviewCount(queue.reviewWords.length);
      const currentStreak = await checkIn(db);
      setStreak(currentStreak);
      const today = new Date().toISOString().split('T')[0];
      const todayLog = await getTodayStudyLog(db, today);
      if (todayLog) {
        setTodayNew(todayLog.newWordsLearned);
        setTodayReview(todayLog.wordsReviewed);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [db, selectedBookId, newWordsPerDay]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartStudy = () => {
    if (newCount === 0 && reviewCount === 0) {
      Alert.alert('提示', '今天没有需要学习的单词，明天再来吧！');
      return;
    }
    router.push('/study');
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
      <Header title="词达人" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.fireIcon}>
              <MaterialIcons name="local-fire-department" size={26} color="#D97706" />
            </View>
            <View>
              <Text style={styles.streakLabel}>连续打卡</Text>
              <Text style={styles.streakNumber}>{streak}天</Text>
            </View>
          </View>
          <View style={styles.streakRing}>
            <View style={styles.ringOuter}>
              <MaterialIcons name="flag" size={18} color="#D97706" />
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>新词</Text>
            <Text style={styles.statsNumber}>{todayNew}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>复习</Text>
            <Text style={styles.statsNumber}>{todayReview}</Text>
          </View>
        </View>

        {/* Queue Details */}
        <View style={styles.queueCard}>
          <View style={styles.queueRow}>
            <View style={styles.queueIcon}>
              <MaterialIcons name="menu-book" size={20} color="#005ea1" />
            </View>
            <View style={styles.queueContent}>
              <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>新词 {newCount} 个</Text>
                <Text style={styles.queueCount}>0/{newCount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '0%', backgroundColor: '#005ea1' }]} />
              </View>
            </View>
          </View>

          <View style={[styles.queueRow, { marginTop: 16 }]}>
            <View style={[styles.queueIcon, { backgroundColor: '#e6f4f9' }]}>
              <MaterialIcons name="history" size={20} color="#18618c" />
            </View>
            <View style={styles.queueContent}>
              <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>待复习 {reviewCount} 个</Text>
                <Text style={styles.queueCount}>0/{reviewCount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '0%', backgroundColor: '#18618c' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartStudy} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>开始学习</Text>
        </TouchableOpacity>

        {/* Bottom Grid */}
        <View style={styles.bottomGrid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/book')}>
            <View style={styles.gridIcon}>
              <MaterialIcons name="auto-stories" size={22} color="#005ea1" />
            </View>
            <Text style={styles.gridText}>词书</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/stats')}>
            <View style={[styles.gridIcon, { backgroundColor: '#e6f4f9' }]}>
              <MaterialIcons name="bar-chart" size={22} color="#18618c" />
            </View>
            <Text style={styles.gridText}>统计</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  scrollView: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fc' },
  loadingText: { fontSize: 16, color: '#717782' },
  streakCard: {
    backgroundColor: '#FFF3CD', borderRadius: 16, padding: 20, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(193,199,210,0.2)',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fireIcon: {
    backgroundColor: '#ebdfba', borderRadius: 999, width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  streakLabel: { fontSize: 12, fontWeight: '500', color: '#4e472b', letterSpacing: 0.05 },
  streakNumber: { fontSize: 24, fontWeight: '700', color: '#D97706', lineHeight: 32 },
  streakRing: { width: 44, height: 44 },
  ringOuter: {
    width: 44, height: 44, borderRadius: 999,
    borderWidth: 2, borderColor: 'rgba(217,119,6,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 28, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.1)',
  },
  statsItem: { flex: 1, alignItems: 'center' },
  statsLabel: { fontSize: 12, fontWeight: '500', color: '#414751', marginBottom: 4, letterSpacing: 0.05 },
  statsNumber: { fontSize: 36, fontWeight: '700', color: '#005ea1', lineHeight: 44, letterSpacing: -0.02 },
  statsDivider: { width: 1, height: 48, backgroundColor: 'rgba(193,199,210,0.2)' },
  queueCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 12,
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.1)',
  },
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  queueIcon: {
    backgroundColor: 'rgba(43,120,191,0.15)', borderRadius: 10,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  queueContent: { flex: 1 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  queueTitle: { fontSize: 15, fontWeight: '400', color: '#191c1e' },
  queueCount: { fontSize: 12, fontWeight: '500', color: '#414751' },
  progressTrack: { height: 6, backgroundColor: '#e6e8eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  startButton: {
    backgroundColor: '#4A90D9', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 12,
    shadowColor: '#4A90D9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 20,
    elevation: 4,
  },
  startButtonText: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  bottomGrid: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  gridItem: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.1)',
  },
  gridIcon: {
    backgroundColor: 'rgba(43,120,191,0.15)', borderRadius: 8, padding: 8,
  },
  gridText: { fontSize: 15, fontWeight: '500', color: '#191c1e' },
});
