import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/DashboardPage';
import { AuthProvider } from '../context/AuthContext';
import { analyticsApi } from '../api/analytics';
import { feedbacksApi } from '../api/feedbacks';

vi.mock('../api/analytics', () => ({
  analyticsApi: {
    getDashboard: vi.fn(),
  },
}));

vi.mock('../api/feedbacks', () => ({
  feedbacksApi: {
    list: vi.fn(),
  },
}));

describe('DashboardPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders dashboard metrics and summary KPI cards correctly', async () => {
    (analyticsApi.getDashboard as any).mockResolvedValueOnce({
      summary: {
        total_submissions: 42,
        unresolved_count: 14,
        new_count: 5,
        in_progress_count: 9,
        resolved_count: 24,
        closed_count: 4,
        overdue_count: 2,
        avg_resolution_time_hours: 6.5,
      },
      trends: [{ date: '2026-10-09', total_submissions: 5, resolved_submissions: 3 }],
      category_distribution: [{ name: 'Tech', count: 20, percentage: 47.6 }],
      priority_distribution: [{ name: 'High', count: 12, percentage: 28.5 }],
      sentiment_distribution: [{ name: 'Negative', count: 18, percentage: 42.8 }],
      department_workload: [
        { department_name: 'Engineering', active_count: 8, total_count: 25, resolved_count: 17 },
      ],
    });

    (feedbacksApi.list as any).mockResolvedValueOnce({
      items: [
        {
          id: 'fb-1',
          reference_number: 'FP-2026-RECENT',
          title: 'Recent UI latency spike',
          status: 'in_progress',
          priority: 'high',
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      size: 5,
      pages: 1,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Assert KPI metrics are displayed
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('6.5 hrs')).toBeInTheDocument();
    expect(screen.getByText(/Recent UI latency spike/i)).toBeInTheDocument();
  });
});
