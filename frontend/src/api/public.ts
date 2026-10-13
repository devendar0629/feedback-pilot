import { apiClient } from './client';
import {
  Category,
  Comment,
  Department,
  FeedbackSubmissionResponse,
  PublicTrackingResponse,
} from '../types';

export interface PublicSubmitData {
  title: string;
  description: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  location?: string;
  is_anonymous: boolean;
  category_id?: string;
  department_id?: string;
}

export const publicApi = {
  submitFeedback: async (data: PublicSubmitData): Promise<FeedbackSubmissionResponse> => {
    const res = await apiClient.post<FeedbackSubmissionResponse>('/public/feedback', data);
    return res.data;
  },

  trackFeedback: async (credentials: {
    reference_number: string;
    tracking_secret: string;
  }): Promise<PublicTrackingResponse> => {
    const res = await apiClient.post<PublicTrackingResponse>('/public/track', credentials);
    return res.data;
  },

  addPublicComment: async (data: {
    reference_number: string;
    tracking_secret: string;
    content: string;
    author_name?: string;
  }): Promise<Comment> => {
    const res = await apiClient.post<Comment>('/public/track/comment', data);
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/public/categories');
    return res.data;
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<Department[]>('/public/departments');
    return res.data;
  },
};
