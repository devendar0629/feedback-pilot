import { apiClient } from './client';
import { AIStats, Category, Department, User } from '../types';

export const adminApi = {
  // Users
  listUsers: async (params?: { role?: string; department_id?: string }): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users', { params });
    return res.data;
  },

  createUser: async (user: any): Promise<User> => {
    const res = await apiClient.post<User>('/users', user);
    return res.data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${id}`, updates);
    return res.data;
  },

  // Departments
  listDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<Department[]>('/departments');
    return res.data;
  },

  createDepartment: async (dept: {
    name: string;
    code: string;
    description?: string;
  }): Promise<Department> => {
    const res = await apiClient.post<Department>('/departments', dept);
    return res.data;
  },

  updateDepartment: async (id: string, updates: Partial<Department>): Promise<Department> => {
    const res = await apiClient.patch<Department>(`/departments/${id}`, updates);
    return res.data;
  },

  // Categories
  listCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },

  createCategory: async (cat: {
    name: string;
    department_id?: string;
    description?: string;
  }): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', cat);
    return res.data;
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const res = await apiClient.patch<Category>(`/categories/${id}`, updates);
    return res.data;
  },

  // AI Management
  getAIStats: async (): Promise<AIStats> => {
    const res = await apiClient.get<AIStats>('/admin/ai-stats');
    return res.data;
  },

  updateAISettings: async (settings: {
    ai_enabled: boolean;
    model_name?: string;
  }): Promise<AIStats> => {
    const res = await apiClient.post<AIStats>('/admin/ai-settings', settings);
    return res.data;
  },

  retryAI: async (feedbackId: string) => {
    const res = await apiClient.post(`/admin/ai-retry/${feedbackId}`);
    return res.data;
  },

  getAuditLogs: async (params?: { action?: string; limit?: number }) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },
};
