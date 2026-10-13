export type UserRole = 'administrator' | 'agent' | 'reporter';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  department_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_information'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  department_id?: string | null;
  department_name?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export type AIAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface AIAnalysis {
  id: string;
  feedback_id: string;
  status: AIAnalysisStatus;
  model_name?: string | null;
  suggested_category_id?: string | null;
  suggested_category_name?: string | null;
  suggested_department_id?: string | null;
  suggested_department_name?: string | null;
  suggested_priority?: FeedbackPriority | null;
  suggested_sentiment?: FeedbackSentiment | null;
  urgency_score?: number | null;
  summary?: string | null;
  suggested_next_action?: string | null;
  confidence_score?: number | null;
  attempts: number;
  error_message?: string | null;
  duration_ms?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface Comment {
  id: string;
  feedback_id: string;
  author_id?: string | null;
  author_name: string;
  is_internal: boolean;
  content: string;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  feedback_id: string;
  from_status?: string | null;
  to_status: string;
  changed_by_id?: string | null;
  changed_by_name?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  reporter_id?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_phone?: string | null;
  location?: string | null;
  is_anonymous: boolean;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  sentiment?: FeedbackSentiment | null;
  department_id?: string | null;
  department_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  assigned_to_id?: string | null;
  assigned_to_name?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  comment_count: number;
  ai_status?: string | null;
}

export interface FeedbackDetail extends Feedback {
  ai_analysis?: AIAnalysis | null;
  comments: Comment[];
  status_history: StatusHistory[];
}

export interface PublicTrackingResponse {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  department_name?: string | null;
  category_name?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  timeline: StatusHistory[];
  public_comments: Comment[];
}

export interface FeedbackSubmissionResponse {
  id: string;
  reference_number: string;
  tracking_secret: string;
  title: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  created_at: string;
  message: string;
}

export interface DashboardSummary {
  total_submissions: number;
  unresolved_count: number;
  new_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
  overdue_count: number;
  avg_resolution_time_hours: number;
}

export interface TrendItem {
  date: string;
  total_submissions: number;
  resolved_submissions: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface DepartmentWorkloadItem {
  department_id?: string | null;
  department_name: string;
  active_count: number;
  total_count: number;
  resolved_count: number;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  trends: TrendItem[];
  category_distribution: DistributionItem[];
  priority_distribution: DistributionItem[];
  sentiment_distribution: DistributionItem[];
  department_workload: DepartmentWorkloadItem[];
}

export interface AIStats {
  total_analyzed: number;
  completed_count: number;
  failed_count: number;
  skipped_count: number;
  success_rate_percentage: number;
  avg_duration_ms: number;
  current_model: string;
  ai_enabled: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  feedback_id?: string | null;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
