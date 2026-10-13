import { apiClient } from './client';
import {
  Comment,
  Feedback,
  FeedbackDetail,
  FeedbackPriority,
  FeedbackSentiment,
  FeedbackStatus,
  PaginatedResponse,
} from '../types';

export interface FeedbackFilterParams {
  page?: number;
  size?: number;
  search?: string;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  sentiment?: FeedbackSentiment;
  department_id?: string;
  category_id?: string;
  assigned_to_id?: string;
}

export const feedbacksApi = {
  list: async (params?: FeedbackFilterParams): Promise<PaginatedResponse<Feedback>> => {
    const res = await apiClient.get<PaginatedResponse<Feedback>>('/feedbacks', { params });
    return res.data;
  },

  getById: async (id: string): Promise<FeedbackDetail> => {
    const res = await apiClient.get<FeedbackDetail>(`/feedbacks/${id}`);
    return res.data;
  },

  update: async (id: string, updates: Partial<Feedback>): Promise<Feedback> => {
    const res = await apiClient.patch<Feedback>(`/feedbacks/${id}`, updates);
    return res.data;
  },

  transitionStatus: async (
    id: string,
    target_status: FeedbackStatus,
    reason?: string
  ): Promise<Feedback> => {
    const res = await apiClient.post<Feedback>(`/feedbacks/${id}/transition`, {
      target_status,
      reason,
    });
    return res.data;
  },

  assign: async (
    id: string,
    data: { department_id?: string; assigned_to_id?: string; note?: string }
  ): Promise<Feedback> => {
    const res = await apiClient.post<Feedback>(`/feedbacks/${id}/assign`, data);
    return res.data;
  },

  applyAI: async (
    id: string,
    options: {
      apply_category?: boolean;
      apply_department?: boolean;
      apply_priority?: boolean;
      apply_sentiment?: boolean;
    }
  ): Promise<Feedback> => {
    const res = await apiClient.post<Feedback>(`/feedbacks/${id}/apply-ai`, options);
    return res.data;
  },

  addComment: async (
    feedbackId: string,
    data: { content: string; is_internal: boolean }
  ): Promise<Comment> => {
    const res = await apiClient.post<Comment>(`/feedbacks/${feedbackId}/comments`, data);
    return res.data;
  },

  getComments: async (feedbackId: string): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(`/feedbacks/${feedbackId}/comments`);
    return res.data;
  },
};
