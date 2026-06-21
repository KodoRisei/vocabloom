import api from './api';
import type {
  ApiResponse,
  CreateSessionResponse,
  QuizSession,
  QuizWindow,
  SubmitAnswerResponse,
} from '../types';

export const quizApi = {
  createSession: (questionCount: number) =>
    api
      .post<ApiResponse<CreateSessionResponse>>('/quiz/sessions', { questionCount })
      .then((r) => r.data),

  getSession: (id: string) =>
    api.get<ApiResponse<QuizSession>>(`/quiz/sessions/${id}`).then((r) => r.data),

  getWindow: (sessionId: string) =>
    api
      .get<ApiResponse<QuizWindow>>(`/quiz/sessions/${sessionId}/window`)
      .then((r) => r.data),

  submitAnswer: (sessionId: string, vocabularyId: string, selectedVocabularyId: string) =>
    api
      .post<ApiResponse<SubmitAnswerResponse>>(`/quiz/sessions/${sessionId}/answer`, {
        vocabularyId,
        selectedVocabularyId,
      })
      .then((r) => r.data),

  completeSession: (id: string) =>
    api.patch<ApiResponse<QuizSession>>(`/quiz/sessions/${id}/complete`).then((r) => r.data),

  abandonSession: (id: string) =>
    api.patch<ApiResponse<null>>(`/quiz/sessions/${id}/abandon`).then((r) => r.data),
};
