import * as SQLite from 'expo-sqlite';
import { Word } from '../types';

interface RawWord {
  word: string;
  phonetic?: string;
  definition?: string;
  meaning?: string;
  translation?: string;
  example?: string;
  content?: string;
}

export async function importBookAndWords(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  bookName: string,
  words: RawWord[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Insert book
    await db.runAsync(
      'INSERT OR REPLACE INTO books (id, name, word_count, description) VALUES (?, ?, ?, ?)',
      [bookId, bookName, words.length, `${bookName} - ${words.length}词`]
    );

    // Clear existing words for this book
    await db.runAsync('DELETE FROM words WHERE book_id = ?', [bookId]);

    // Insert words
    const stmt = await db.prepareAsync(
      'INSERT INTO words (word, phonetic, meaning, example, book_id, word_index) VALUES ($word, $phonetic, $meaning, $example, $bookId, $index)'
    );

    try {
      for (let i = 0; i < words.length; i++) {
        const raw = words[i];
        await stmt.executeAsync({
          $word: raw.word.toLowerCase().trim(),
          $phonetic: raw.phonetic || '',
          $meaning: raw.meaning || raw.definition || raw.translation || '',
          $example: raw.example || raw.content || '',
          $bookId: bookId,
          $index: i + 1,
        });
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

export function parseVocabularyJSON(jsonString: string): RawWord[] {
  try {
    const data = JSON.parse(jsonString);

    // Handle array format
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        word: item.word || item.headWord || item.head || '',
        phonetic: item.phonetic || item.usphone || item.ukphone || '',
        meaning: item.meaning || item.definition || item.translation || item.trans || '',
        example: item.example || item.content || item.sentence || '',
      }));
    }

    // Handle object format with words array
    if (data.words && Array.isArray(data.words)) {
      return parseVocabularyJSON(JSON.stringify(data.words));
    }

    return [];
  } catch (error) {
    console.error('Failed to parse vocabulary JSON:', error);
    return [];
  }
}

export function parseVocabularyCSV(csvString: string): RawWord[] {
  const lines = csvString.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const wordIndex = headers.findIndex((h) => h.includes('word') || h.includes('head'));
  const phoneticIndex = headers.findIndex((h) => h.includes('phonetic') || h.includes('phone'));
  const meaningIndex = headers.findIndex((h) => h.includes('meaning') || h.includes('definition') || h.includes('translation') || h.includes('trans'));
  const exampleIndex = headers.findIndex((h) => h.includes('example') || h.includes('sentence') || h.includes('content'));

  return lines.slice(1).map((line) => {
    const fields = line.split(',').map((f) => f.trim().replace(/"/g, ''));
    return {
      word: fields[wordIndex] || '',
      phonetic: phoneticIndex >= 0 ? fields[phoneticIndex] : '',
      meaning: meaningIndex >= 0 ? fields[meaningIndex] : '',
      example: exampleIndex >= 0 ? fields[exampleIndex] : '',
    };
  }).filter((w) => w.word);
}
