import * as SQLite from 'expo-sqlite';
import { Card, Rating, Word } from '../types';
import * as queries from '../db/queries';
import { scheduleNext, createNewCard, fsrsCardToDbCard } from './fsrsService';

export interface StudySession {
  newWords: { word: Word; card: Card }[];
  reviewWords: { word: Word; card: Card }[];
}

export async function getTodayStudyQueue(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  newWordsPerDay: number
): Promise<StudySession> {
  const now = Date.now();

  // Get due review cards (no limit, get all due)
  const dueCards = await queries.getDueCards(db, now, 10000);

  // Get new cards
  const newCards = await queries.getNewCards(db, bookId, newWordsPerDay);

  // Fetch word details for review cards
  const reviewWords: { word: Word; card: Card }[] = [];
  for (const card of dueCards) {
    const word = await queries.getWordById(db, card.wordId);
    if (word) {
      reviewWords.push({ word, card });
    }
  }

  // Fetch word details for new cards
  const newWords: { word: Word; card: Card }[] = [];
  for (const card of newCards) {
    const word = await queries.getWordById(db, card.wordId);
    if (word) {
      newWords.push({ word, card });
    }
  }

  return { newWords, reviewWords };
}

export async function processRating(
  db: SQLite.SQLiteDatabase,
  card: Card,
  rating: Rating
): Promise<Card> {
  const updatedCard = scheduleNext(card, rating);
  await queries.upsertCard(db, {
    wordId: updatedCard.wordId,
    due: updatedCard.due,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsedDays: updatedCard.elapsedDays,
    scheduledDays: updatedCard.scheduledDays,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: updatedCard.state,
    lastReview: updatedCard.lastReview,
  });
  return updatedCard;
}

export async function recordStudy(
  db: SQLite.SQLiteDatabase,
  isNewWord: boolean,
  studyTimeSeconds: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await queries.upsertStudyLog(db, {
    date: today,
    newWordsLearned: isNewWord ? 1 : 0,
    wordsReviewed: isNewWord ? 0 : 1,
    totalStudyTime: studyTimeSeconds,
  });
}

export async function checkIn(db: SQLite.SQLiteDatabase): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await queries.getCheckIn(db, today);

  if (existing) {
    return existing.streakCount;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayCheckIn = await queries.getCheckIn(db, yesterday);
  const streakCount = yesterdayCheckIn ? yesterdayCheckIn.streakCount + 1 : 1;

  await queries.createCheckIn(db, today, streakCount);
  return streakCount;
}

export async function getStudyStats(db: SQLite.SQLiteDatabase, bookId: string) {
  const stateCounts = await queries.getCardCountByState(db, bookId);
  const studyLogs = await queries.getStudyLogs(db, 30);
  const checkIns = await queries.getCheckIns(db, 365);

  const stateMap: Record<number, number> = {};
  for (const row of stateCounts) {
    stateMap[row.state] = row.count;
  }

  return {
    newCount: stateMap[0] || 0,
    learningCount: stateMap[1] || 0,
    reviewCount: stateMap[2] || 0,
    relearningCount: stateMap[3] || 0,
    studyLogs,
    checkIns,
  };
}
