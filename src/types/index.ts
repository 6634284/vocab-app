export interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  bookId: string;
  wordIndex: number;
}

export interface Card {
  id: number;
  wordId: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: number;
}

export interface Book {
  id: string;
  name: string;
  wordCount: number;
  description: string;
}

export interface StudyLog {
  id: number;
  date: string;
  newWordsLearned: number;
  wordsReviewed: number;
  totalStudyTime: number;
}

export interface CheckIn {
  id: number;
  date: string;
  streakCount: number;
}

export type Rating = 'Again' | 'Hard' | 'Good';

export interface ButtonPreview {
  rating: Rating;
  label: string;
  color: string;
  bgColor: string;
  interval: number;
}
