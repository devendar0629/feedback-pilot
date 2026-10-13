import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicSubmitPage } from '../pages/PublicSubmitPage';
import { publicApi } from '../api/public';

vi.mock('../api/public', () => ({
  publicApi: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', name: 'Billing Glitch' },
      { id: 'cat-2', name: 'Performance Issue' },
    ]),
    getDepartments: vi.fn().mockResolvedValue([
      { id: 'dept-1', name: 'Finance', code: 'FIN' },
      { id: 'dept-2', name: 'Tech Support', code: 'TECH' },
    ]),
    submitFeedback: vi.fn(),
  },
}));

describe('PublicSubmitPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders form fields including subject, description, and anonymous toggle', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PublicSubmitPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/Billing charge error/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Please provide full details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Submit Anonymously/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeInTheDocument();
  });

  it('validates minimum length for title and description', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PublicSubmitPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Billing charge error/i), {
      target: { value: 'Hi' }, // Too short
    });
    fireEvent.change(screen.getByPlaceholderText(/Please provide full details/i), {
      target: { value: 'Short' }, // Too short
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/Title must be at least 3 characters/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Description must provide at least 10 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('successfully submits valid feedback data', async () => {
    (publicApi.submitFeedback as any).mockResolvedValueOnce({
      id: 'fb-123',
      reference_number: 'FP-2026-X8K9M2',
      tracking_secret: 'tr_test_secret_123',
      title: 'Valid Ticket Title',
      status: 'submitted',
      priority: 'medium',
      created_at: new Date().toISOString(),
      message: 'Submitted',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PublicSubmitPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Billing charge error/i), {
      target: { value: 'Payment failed with code 402' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Please provide full details/i), {
      target: { value: 'Customer card was debited but subscription was not activated in dashboard.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(publicApi.submitFeedback).toHaveBeenCalledTimes(1);
    });
  });
});
