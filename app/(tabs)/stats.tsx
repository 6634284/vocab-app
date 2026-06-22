import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Header } from '../../src/components/Header';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { getStudyStats } from '../../src/services/studyService';

export default function StatsPage() {
  const db = useSQLiteContext();
  const { selectedBookId } = useSettingsStore();

  const [stats, setStats] = useState({
    newCount: 0,
    learningCount: 0,
    reviewCount: 0,
    relearningCount: 0,
    studyLogs: [] as any[],
    checkIns: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStudyStats(db, selectedBookId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [db, selectedBookId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const totalWords = stats.newCount + stats.learningCount + stats.reviewCount + stats.relearningCount;
  const currentStreak = stats.checkIns.length > 0 ? stats.checkIns[0].streakCount : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const log = stats.studyLogs.find((l: any) => l.date === dateStr);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count: log ? log.newWordsLearned + log.wordsReviewed : 0,
    };
  });

  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);

  const totalNew = stats.studyLogs.reduce((sum: number, l: any) => sum + l.newWordsLearned, 0);
  const totalReview = stats.studyLogs.reduce((sum: number, l: any) => sum + l.wordsReviewed, 0);
  const totalMinutes = Math.round(stats.studyLogs.reduce((sum: number, l: any) => sum + l.totalStudyTime, 0) / 60);

  return (
    <View style={styles.container}>
      <Header title="学习统计" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>连续打卡</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>天</Text>
          </View>
        </View>

        {/* Word Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>词汇掌握度</Text>
          <View style={styles.distRow}>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: '#e0e3e6' }]} />
              <Text style={styles.distLabel}>未学</Text>
              <Text style={styles.distCount}>{stats.newCount}</Text>
            </View>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.distLabel}>学习中</Text>
              <Text style={styles.distCount}>{stats.learningCount + stats.relearningCount}</Text>
            </View>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: '#005ea1' }]} />
              <Text style={styles.distLabel}>已掌握</Text>
              <Text style={styles.distCount}>{stats.reviewCount}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: totalWords > 0 ? `${((stats.learningCount + stats.relearningCount) / totalWords) * 100}%` : '0%',
              backgroundColor: '#D97706',
            }]} />
            <View style={[styles.progressFill, {
              width: totalWords > 0 ? `${(stats.reviewCount / totalWords) * 100}%` : '0%',
              backgroundColor: '#005ea1',
            }]} />
          </View>
        </View>

        {/* 7-Day Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>近7日学习量</Text>
          <View style={styles.chartArea}>
            {last7Days.map((day, index) => (
              <View key={index} style={styles.chartBarWrapper}>
                <View style={styles.chartBarContainer}>
                  <View style={[styles.chartBar, {
                    height: `${(day.count / maxCount) * 100}%`,
                    backgroundColor: day.count > 0 ? '#005ea1' : '#e6e8eb',
                  }]} />
                </View>
                <Text style={styles.chartLabel}>{day.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalNew}</Text>
            <Text style={styles.summaryLabel}>累计新词</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalReview}</Text>
            <Text style={styles.summaryLabel}>累计复习</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalMinutes}</Text>
            <Text style={styles.summaryLabel}>学习分钟</Text>
          </View>
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
    backgroundColor: '#FFF3CD', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(193,199,210,0.2)',
  },
  streakLabel: { fontSize: 12, fontWeight: '500', color: '#4e472b', letterSpacing: 0.05 },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  streakNumber: { fontSize: 48, fontWeight: '700', color: '#D97706' },
  streakUnit: { fontSize: 14, fontWeight: '500', color: '#D97706' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 12,
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.1)',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#191c1e', marginBottom: 20 },
  distRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  distItem: { alignItems: 'center' },
  distDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  distLabel: { fontSize: 12, fontWeight: '500', color: '#414751', marginBottom: 4 },
  distCount: { fontSize: 22, fontWeight: '700', color: '#191c1e' },
  progressTrack: {
    height: 8, backgroundColor: '#e6e8eb', borderRadius: 4,
    overflow: 'hidden', flexDirection: 'row',
  },
  progressFill: { height: '100%' },
  chartArea: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120,
  },
  chartBarWrapper: { flex: 1, alignItems: 'center' },
  chartBarContainer: { width: 24, height: 90, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 11, fontWeight: '500', color: '#717782', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    alignItems: 'center',
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.1)',
  },
  summaryNumber: { fontSize: 24, fontWeight: '700', color: '#005ea1' },
  summaryLabel: { fontSize: 12, fontWeight: '500', color: '#414751', marginTop: 4 },
});
