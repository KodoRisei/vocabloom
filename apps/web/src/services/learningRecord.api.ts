import api from './api';
import type { LearningRecord, ApiResponse, Stats } from '../types';

export const learningRecordApi = {
  list: () =>
    api.get<ApiResponse<LearningRecord[]>>('/learning-records').then((r) => r.data),

  getByVocabulary: (vocabularyId: string) =>
    api
      .get<ApiResponse<LearningRecord | null>>(`/learning-records/vocabulary/${vocabularyId}`)
      .then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<Stats>>('/learning-records/stats').then((r) => r.data),
};
