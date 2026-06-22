import * as SQLite from 'expo-sqlite';
import { Book, Card, CheckIn, StudyLog, Word } from '../types';

// Books
export async function getAllBooks(db: SQLite.SQLiteDatabase): Promise<Book[]> {
  return db.getAllAsync<Book>('SELECT id, name, word_count as wordCount, description FROM books');
}

export async function getBookById(db: SQLite.SQLiteDatabase, id: string): Promise<Book | null> {
  return db.getFirstAsync<Book>(
    'SELECT id, name, word_count as wordCount, description FROM books WHERE id = ?',
    [id]
  );
}

// Words
export async function getWordsByBook(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  limit?: number,
  offset?: number
): Promise<Word[]> {
  const query = limit
    ? 'SELECT id, word, phonetic, meaning, example, book_id as bookId, word_index as wordIndex FROM words WHERE book_id = ? LIMIT ? OFFSET ?'
    : 'SELECT id, word, phonetic, meaning, example, book_id as bookId, word_index as wordIndex FROM words WHERE book_id = ?';
  const params = limit ? [bookId, limit, offset || 0] : [bookId];
  return db.getAllAsync<Word>(query, params);
}

export async function getWordById(db: SQLite.SQLiteDatabase, id: number): Promise<Word | null> {
  return db.getFirstAsync<Word>(
    'SELECT id, word, phonetic, meaning, example, book_id as bookId, word_index as wordIndex FROM words WHERE id = ?',
    [id]
  );
}

export async function searchWords(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  keyword: string
): Promise<Word[]> {
  return db.getAllAsync<Word>(
    `SELECT id, word, phonetic, meaning, example, book_id as bookId, word_index as wordIndex
     FROM words WHERE book_id = ? AND (word LIKE ? OR meaning LIKE ?)`,
    [bookId, `%${keyword}%`, `%${keyword}%`]
  );
}

// Cards
export async function getCardByWordId(
  db: SQLite.SQLiteDatabase,
  wordId: number
): Promise<Card | null> {
  return db.getFirstAsync<Card>(
    `SELECT id, word_id as wordId, due, stability, difficulty,
     elapsed_days as elapsedDays, scheduled_days as scheduledDays,
     reps, lapses, state, last_review as lastReview
     FROM cards WHERE word_id = ?`,
    [wordId]
  );
}

export async function getDueCards(
  db: SQLite.SQLiteDatabase,
  now: number,
  limit: number
): Promise<Card[]> {
  return db.getAllAsync<Card>(
    `SELECT id, word_id as wordId, due, stability, difficulty,
     elapsed_days as elapsedDays, scheduled_days as scheduledDays,
     reps, lapses, state, last_review as lastReview
     FROM cards WHERE due <= ? AND state != 0
     ORDER BY due ASC LIMIT ?`,
    [now, limit]
  );
}

export async function getNewCards(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  limit: number
): Promise<Card[]> {
  return db.getAllAsync<Card>(
    `SELECT c.id, c.word_id as wordId, c.due, c.stability, c.difficulty,
     c.elapsed_days as elapsedDays, c.scheduled_days as scheduledDays,
     c.reps, c.lapses, c.state, c.last_review as lastReview
     FROM cards c
     JOIN words w ON c.word_id = w.id
     WHERE w.book_id = ? AND c.state = 0
     ORDER BY w.word_index ASC LIMIT ?`,
    [bookId, limit]
  );
}

export async function upsertCard(db: SQLite.SQLiteDatabase, card: Omit<Card, 'id'>): Promise<void> {
  await db.runAsync(
    `INSERT INTO cards (word_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(word_id) DO UPDATE SET
       due = excluded.due,
       stability = excluded.stability,
       difficulty = excluded.difficulty,
       elapsed_days = excluded.elapsed_days,
       scheduled_days = excluded.scheduled_days,
       reps = excluded.reps,
       lapses = excluded.lapses,
       state = excluded.state,
       last_review = excluded.last_review`,
    [
      card.wordId, card.due, card.stability, card.difficulty,
      card.elapsedDays, card.scheduledDays, card.reps, card.lapses,
      card.state, card.lastReview,
    ]
  );
}

export async function getCardCountByState(
  db: SQLite.SQLiteDatabase,
  bookId: string
): Promise<{ state: number; count: number }[]> {
  return db.getAllAsync<{ state: number; count: number }>(
    `SELECT c.state, COUNT(*) as count
     FROM cards c JOIN words w ON c.word_id = w.id
     WHERE w.book_id = ?
     GROUP BY c.state`,
    [bookId]
  );
}

export async function initCardsForBook(
  db: SQLite.SQLiteDatabase,
  bookId: string
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO cards (word_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review)
     SELECT id, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM words WHERE book_id = ?`,
    [bookId]
  );
}

// Study Logs
export async function getTodayStudyLog(db: SQLite.SQLiteDatabase, date: string): Promise<StudyLog | null> {
  return db.getFirstAsync<StudyLog>(
    `SELECT id, date, new_words_learned as newWordsLearned,
     words_reviewed as wordsReviewed, total_study_time as totalStudyTime
     FROM study_logs WHERE date = ?`,
    [date]
  );
}

export async function upsertStudyLog(
  db: SQLite.SQLiteDatabase,
  log: { date: string; newWordsLearned: number; wordsReviewed: number; totalStudyTime: number }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO study_logs (date, new_words_learned, words_reviewed, total_study_time)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       new_words_learned = new_words_learned + excluded.new_words_learned,
       words_reviewed = words_reviewed + excluded.words_reviewed,
       total_study_time = total_study_time + excluded.total_study_time`,
    [log.date, log.newWordsLearned, log.wordsReviewed, log.totalStudyTime]
  );
}

export async function getStudyLogs(
  db: SQLite.SQLiteDatabase,
  days: number
): Promise<StudyLog[]> {
  return db.getAllAsync<StudyLog>(
    `SELECT id, date, new_words_learned as newWordsLearned,
     words_reviewed as wordsReviewed, total_study_time as totalStudyTime
     FROM study_logs ORDER BY date DESC LIMIT ?`,
    [days]
  );
}

// Check-ins
export async function getCheckIn(db: SQLite.SQLiteDatabase, date: string): Promise<CheckIn | null> {
  return db.getFirstAsync<CheckIn>(
    'SELECT id, date, streak_count as streakCount FROM check_ins WHERE date = ?',
    [date]
  );
}

export async function createCheckIn(
  db: SQLite.SQLiteDatabase,
  date: string,
  streakCount: number
): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO check_ins (date, streak_count) VALUES (?, ?)',
    [date, streakCount]
  );
}

export async function getCheckIns(
  db: SQLite.SQLiteDatabase,
  days: number
): Promise<CheckIn[]> {
  return db.getAllAsync<CheckIn>(
    'SELECT id, date, streak_count as streakCount FROM check_ins ORDER BY date DESC LIMIT ?',
    [days]
  );
}
