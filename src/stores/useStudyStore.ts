import { create } from 'zustand';
import { Card, Word } from '../types';

interface StudyWord {
  word: Word;
  card: Card;
}

interface StudyState {
  queue: StudyWord[];
  currentIndex: number;
  isFlipped: boolean;
  sessionStartTime: number;
  sessionNewCount: number;
  sessionReviewCount: number;

  setQueue: (words: StudyWord[]) => void;
  updateCurrentCard: (card: Card) => void;
  flipCard: () => void;
  resetFlip: () => void;
  moveToNext: () => boolean;
  getCurrentWord: () => StudyWord | null;
  incrementNewCount: () => void;
  incrementReviewCount: () => void;
  resetSession: () => void;
  getProgress: () => { current: number; total: number };
}

export const useStudyStore = create<StudyState>()((set, get) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  sessionStartTime: 0,
  sessionNewCount: 0,
  sessionReviewCount: 0,

  setQueue: (words) => set({
    queue: words,
    currentIndex: 0,
    isFlipped: false,
    sessionStartTime: Date.now(),
    sessionNewCount: 0,
    sessionReviewCount: 0,
  }),

  updateCurrentCard: (card) => set((state) => {
    const newQueue = [...state.queue];
    newQueue[state.currentIndex] = { ...newQueue[state.currentIndex], card };
    return { queue: newQueue };
  }),

  flipCard: () => set({ isFlipped: true }),
  resetFlip: () => set({ isFlipped: false }),

  moveToNext: () => {
    const { currentIndex, queue } = get();
    if (currentIndex + 1 >= queue.length) {
      return false;
    }
    set({ currentIndex: currentIndex + 1, isFlipped: false });
    return true;
  },

  getCurrentWord: () => {
    const { currentIndex, queue } = get();
    return queue[currentIndex] || null;
  },

  incrementNewCount: () => set((s) => ({ sessionNewCount: s.sessionNewCount + 1 })),
  incrementReviewCount: () => set((s) => ({ sessionReviewCount: s.sessionReviewCount + 1 })),

  resetSession: () => set({
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    sessionStartTime: 0,
    sessionNewCount: 0,
    sessionReviewCount: 0,
  }),

  getProgress: () => {
    const { currentIndex, queue } = get();
    return { current: currentIndex + 1, total: queue.length };
  },
}));
