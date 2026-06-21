import { create } from 'zustand';
import type { ActiveItem, JapaneseOption, WindowStats } from '../types';

interface QuizState {
  sessionId: string | null;
  questionCount: number;
  activeItems: ActiveItem[];
  japaneseOptions: JapaneseOption[];
  stats: WindowStats | null;

  selectedEnglishId: string | null;
  correctCount: number;
  incorrectCount: number;
  lastAnswerCorrect: boolean | null;
  isSubmitting: boolean;
  sessionCompleted: boolean;

  initSession: (
    sessionId: string,
    questionCount: number,
    activeItems: ActiveItem[],
    japaneseOptions: JapaneseOption[],
    stats: WindowStats,
  ) => void;
  selectEnglish: (vocabularyId: string) => void;
  handleAnswer: (
    isCorrect: boolean,
    newWindow: { activeItems: ActiveItem[]; japaneseOptions: JapaneseOption[]; stats: WindowStats } | null,
    sessionCompleted: boolean,
  ) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  questionCount: 0,
  activeItems: [],
  japaneseOptions: [],
  stats: null,
  selectedEnglishId: null,
  correctCount: 0,
  incorrectCount: 0,
  lastAnswerCorrect: null,
  isSubmitting: false,
  sessionCompleted: false,
};

export const useQuizStore = create<QuizState>((set) => ({
  ...initialState,

  initSession: (sessionId, questionCount, activeItems, japaneseOptions, stats) =>
    set({ sessionId, questionCount, activeItems, japaneseOptions, stats }),

  selectEnglish: (vocabularyId) =>
    set({ selectedEnglishId: vocabularyId, lastAnswerCorrect: null }),

  handleAnswer: (isCorrect, newWindow, sessionCompleted) =>
    set((state) => ({
      selectedEnglishId: null,
      lastAnswerCorrect: isCorrect,
      correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
      incorrectCount: isCorrect ? state.incorrectCount : state.incorrectCount + 1,
      isSubmitting: false,
      sessionCompleted,
      ...(newWindow
        ? {
            activeItems: newWindow.activeItems,
            japaneseOptions: newWindow.japaneseOptions,
            stats: newWindow.stats,
          }
        : {}),
    })),

  setSubmitting: (v) => set({ isSubmitting: v }),

  reset: () => set(initialState),
}));
