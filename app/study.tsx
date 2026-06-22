import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { useStudyStore } from '../src/stores/useStudyStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { getTodayStudyQueue, processRating, recordStudy } from '../src/services/studyService';
import { getButtonPreviews } from '../src/services/fsrsService';
import { Rating, ButtonPreview } from '../src/types';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

function formatInterval(days: number): string {
  if (days < 1) return '< 1天';
  if (days === 1) return '1天';
  if (days < 30) return `${Math.round(days)}天`;
  if (days < 365) return `${Math.round(days / 30)}个月`;
  return `${(days / 365).toFixed(1)}年`;
}

export default function StudyPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { selectedBookId, newWordsPerDay } = useSettingsStore();
  const {
    queue, currentIndex, setQueue, moveToNext, getCurrentWord,
    incrementNewCount, incrementReviewCount, getProgress, sessionStartTime,
    updateCurrentCard,
  } = useStudyStore();

  const [loading, setLoading] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [ratingDisabled, setRatingDisabled] = useState(false);
  const [previews, setPreviews] = useState<ButtonPreview[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadQueue(); }, []);

  useEffect(() => {
    setShowMeaning(false);
    fadeAnim.setValue(1);
    if (queue[currentIndex]) {
      setPreviews(getButtonPreviews(queue[currentIndex].card));
    }
  }, [currentIndex, queue]);

  const loadQueue = async () => {
    try {
      const session = await getTodayStudyQueue(db, selectedBookId, newWordsPerDay);
      const allWords = [
        ...session.newWords.map((w) => ({ ...w, isNew: true })),
        ...session.reviewWords.map((w) => ({ ...w, isNew: false })),
      ];
      if (allWords.length === 0) {
        Alert.alert('提示', '今天没有需要学习的单词', [
          { text: '确定', onPress: () => router.back() },
        ]);
        return;
      }
      setQueue(allWords);
    } catch (error) {
      Alert.alert('错误', '加载学习数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShowMeaning = () => {
    if (showMeaning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMeaning(true);
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.8,
      pitch: 1.0,
    });
  };

  const handleRate = useCallback(async (rating: Rating) => {
    const current = getCurrentWord();
    if (!current || ratingDisabled) return;
    setRatingDisabled(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const updatedCard = await processRating(db, current.card, rating);
      updateCurrentCard(updatedCard);
      const isNew = current.card.reps === 0;
      const studyTime = Math.round((Date.now() - sessionStartTime) / 1000);
      await recordStudy(db, isNew, studyTime > 0 ? studyTime : 1);
      if (isNew) { incrementNewCount(); } else { incrementReviewCount(); }
      const hasNext = moveToNext();
      if (!hasNext) {
        Alert.alert('完成', '今天的单词已经学完了！', [
          { text: '确定', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Failed to process rating:', error);
    } finally {
      setRatingDisabled(false);
    }
  }, [getCurrentWord, ratingDisabled, db, sessionStartTime]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>准备学习...</Text>
      </View>
    );
  }

  const currentWord = getCurrentWord();
  if (!currentWord) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>没有单词</Text>
      </View>
    );
  }

  const progress = getProgress();
  const word = currentWord.word;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#414751" />
        </TouchableOpacity>
        <Text style={styles.progressText}>{progress.current} / {progress.total}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialIcons name="more-horiz" size={24} color="#414751" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(progress.current / progress.total) * 100}%` }]} />
      </View>

      {/* Word Display Area */}
      <View style={styles.wordArea}>
        {/* Word Section */}
        <View style={styles.wordSection}>
          <Text style={styles.wordText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
            {word.word}
          </Text>
          <View style={styles.phoneticRow}>
            <Text style={styles.phoneticText}>{word.phonetic}</Text>
            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => handleSpeak(word.word)}
            >
              <MaterialIcons name="volume-up" size={20} color="#005ea1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meaning Cover / Display */}
        {!showMeaning ? (
          <TouchableOpacity
            style={styles.coverArea}
            onPress={handleShowMeaning}
            activeOpacity={0.8}
          >
            <View style={styles.coverContent}>
              <MaterialIcons name="visibility-off" size={32} color="#c1c7d2" />
              <Text style={styles.coverHint}>请回忆单词发音和释义</Text>
              <Text style={styles.coverSubHint}>点击屏幕查看释义</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Animated.View style={[styles.meaningArea, { opacity: fadeAnim }]}>
            <View style={styles.meaningDivider} />
            <Text style={styles.meaningText}>{word.meaning}</Text>
            {word.example ? (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>例句</Text>
                <Text style={styles.exampleText}>{word.example}</Text>
              </View>
            ) : null}
          </Animated.View>
        )}
      </View>

      {/* Rating Buttons */}
      {showMeaning && (
        <View style={styles.bottomBar}>
          {previews.map((btn) => (
            <TouchableOpacity
              key={btn.rating}
              style={[styles.rateBtn, { backgroundColor: btn.bgColor }]}
              onPress={() => handleRate(btn.rating)}
              disabled={ratingDisabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.rateBtnLabel, { color: btn.color }]}>{btn.label}</Text>
              <Text style={[styles.rateBtnInterval, { color: btn.color, opacity: 0.7 }]}>
                {formatInterval(btn.interval)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fc' },
  loadingText: { fontSize: 16, color: '#717782' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 52, paddingBottom: 8,
  },
  closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 13, fontWeight: '500', color: '#717782', letterSpacing: 0.05 },
  moreBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  progressBarTrack: { height: 4, backgroundColor: '#e6e8eb' },
  progressBarFill: { height: '100%', backgroundColor: '#005ea1', borderRadius: 2 },

  // Word Area
  wordArea: {
    flex: 1, paddingHorizontal: 32, paddingTop: 40,
  },
  wordSection: {
    alignItems: 'center', marginBottom: 32,
  },
  wordText: {
    fontSize: 40, fontWeight: '700', color: '#191c1e', letterSpacing: -0.02, textAlign: 'center',
  },
  phoneticRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
  },
  phoneticText: { fontSize: 16, color: '#717782' },
  speakerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f2f4f7', justifyContent: 'center', alignItems: 'center',
  },

  // Cover Area
  coverArea: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  coverContent: {
    alignItems: 'center',
  },
  coverHint: {
    fontSize: 16, fontWeight: '500', color: '#717782', marginTop: 16,
  },
  coverSubHint: {
    fontSize: 13, fontWeight: '400', color: '#c1c7d2', marginTop: 8,
  },

  // Meaning Area
  meaningArea: {
    paddingVertical: 24,
  },
  meaningDivider: {
    width: 40, height: 3, backgroundColor: '#005ea1', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  meaningText: {
    fontSize: 18, fontWeight: '500', color: '#191c1e', textAlign: 'center', lineHeight: 28,
  },
  exampleBox: {
    marginTop: 20, backgroundColor: '#f2f4f7', borderRadius: 12, padding: 16,
  },
  exampleLabel: {
    fontSize: 12, fontWeight: '600', color: '#005ea1', marginBottom: 8,
  },
  exampleText: {
    fontSize: 14, color: '#414751', lineHeight: 22,
  },

  // Bottom Buttons
  bottomBar: {
    flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 40, gap: 10,
  },
  rateBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  rateBtnLabel: { fontSize: 16, fontWeight: '600' },
  rateBtnInterval: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
