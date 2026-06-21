export interface Vocabulary {
  id: string;
  englishExpression: string;
  japaneseTranslation: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  learningRecord: LearningRecord | null;
}

export interface LearningRecord {
  id: string;
  vocabularyId: string;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  priorityScore: number;
  lastAnsweredAt: string | null;
  lastCorrectAt: string | null;
}

// Quiz window (sliding window with decoys)
export interface ActiveItem {
  vocabularyId: string;
  englishExpression: string;
  position: number;
}

export interface JapaneseOption {
  vocabularyId: string;
  japaneseTranslation: string;
}

export interface WindowStats {
  totalCount: number;
  answeredCount: number;
  remainingCount: number;
  windowSize: number;
}

export interface QuizWindow {
  activeItems: ActiveItem[];
  japaneseOptions: JapaneseOption[];
  stats: WindowStats;
}

export interface CreateSessionResponse {
  sessionId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  activeItems: ActiveItem[];
  japaneseOptions: JapaneseOption[];
  stats: WindowStats;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  sessionCompleted: boolean;
  window: QuizWindow | null;
}

export interface QuizSession {
  id: string;
  questionCount: number;
  windowSize: number;
  correctCount: number;
  incorrectCount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Stats {
  totalVocabularies: number;
  learnedVocabularies: number;
  completedSessions: number;
  topStreak: { streak: number; expression: string } | null;
}
