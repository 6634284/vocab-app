import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  selectedBookId: string;
  newWordsPerDay: number;
  reviewLimitPerDay: number;
  darkMode: boolean;
  setSelectedBookId: (id: string) => void;
  setNewWordsPerDay: (count: number) => void;
  setReviewLimitPerDay: (count: number) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedBookId: 'hongbaoshu_kaoyan',
      newWordsPerDay: 30,
      reviewLimitPerDay: 200,
      darkMode: false,
      setSelectedBookId: (id) => set({ selectedBookId: id }),
      setNewWordsPerDay: (count) => set({ newWordsPerDay: count }),
      setReviewLimitPerDay: (count) => set({ reviewLimitPerDay: count }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'vocab-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
