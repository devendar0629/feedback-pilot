import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicTrackPage } from '../pages/PublicTrackPage';
import { publicApi } from '../api/public';

vi.mock('../api/public', () => ({
  publicApi: {
    trackFeedback: vi.fn(),
    addPublicComment: vi.fn(),
  },
}));

describe('PublicTrackPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders dual credentials input fields (reference number and secret key)', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PublicTrackPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/FP-2026-X8K9M2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tr_\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lookup Status/i })).toBeInTheDocument();
  });

  it('displays ticket status and timeline upon successful verification', async () => {
    (publicApi.trackFeedback as any).mockResolvedValueOnce({
      id: 'fb-999',
      reference_number: 'FP-2026-ABC123',
      title: 'Water filter replacement',
      description: 'Filter in cafeteria needs replacing.',
      status: 'in_progress',
      priority: 'high',
      department_name: 'Facilities',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timeline: [
        {
          id: 'th-1',
          feedback_id: 'fb-999',
          from_status: null,
          to_status: 'submitted',
          reason: 'Initial submission',
          created_at: new Date().toISOString(),
        },
        {
          id: 'th-2',
          feedback_id: 'fb-999',
          from_status: 'submitted',
          to_status: 'in_progress',
          reason: 'Dispatched maintenance tech',
          created_at: new Date().toISOString(),
        },
      ],
      public_comments: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PublicTrackPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/FP-2026-X8K9M2/i), {
      target: { value: 'FP-2026-ABC123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/tr_\.\.\./i), {
      target: { value: 'tr_valid_secret_key' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lookup Status/i }));

    await waitFor(() => {
      expect(screen.getByText(/Water filter replacement/i)).toBeInTheDocument();
      expect(screen.getByText(/Dispatched maintenance tech/i)).toBeInTheDocument();
    });
  });
});
