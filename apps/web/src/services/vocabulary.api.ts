import api from './api';
import type { Vocabulary, PaginatedResponse, ApiResponse } from '../types';

export const vocabularyApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Vocabulary>>('/vocabularies', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Vocabulary>>(`/vocabularies/${id}`).then((r) => r.data),

  create: (body: { englishExpression: string; japaneseTranslation: string; notes?: string }) =>
    api.post<ApiResponse<Vocabulary>>('/vocabularies', body).then((r) => r.data),

  update: (id: string, body: { englishExpression?: string; japaneseTranslation?: string; notes?: string }) =>
    api.patch<ApiResponse<Vocabulary>>(`/vocabularies/${id}`, body).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/vocabularies/${id}`).then((r) => r.data),
};
