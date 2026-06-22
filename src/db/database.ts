import * as SQLite from 'expo-sqlite';

export async function initDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      meaning TEXT NOT NULL,
      example TEXT,
      book_id TEXT NOT NULL,
      word_index INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL UNIQUE,
      due INTEGER NOT NULL,
      stability REAL NOT NULL DEFAULT 0,
      difficulty REAL NOT NULL DEFAULT 0,
      elapsed_days INTEGER NOT NULL DEFAULT 0,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      state INTEGER NOT NULL DEFAULT 0,
      last_review INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (word_id) REFERENCES words(id)
    );

    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      new_words_learned INTEGER NOT NULL DEFAULT 0,
      words_reviewed INTEGER NOT NULL DEFAULT 0,
      total_study_time INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      streak_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due);
    CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state);
    CREATE INDEX IF NOT EXISTS idx_words_book ON words(book_id);
    CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(date);
    CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(date);
  `);
}
