import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommentSection } from '../components/feedback/CommentSection';
import { Comment } from '../types';

describe('CommentSection Component Privacy Separation', () => {
  const mockComments: Comment[] = [
    {
      id: 'c-1',
      feedback_id: 'fb-1',
      author_name: 'Agent Support',
      is_internal: false,
      content: 'Hello, we are investigating your reported issue.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-2',
      feedback_id: 'fb-1',
      author_name: 'Lead Engineer',
      is_internal: true,
      content: 'INTERNAL CONFIDENTIAL: Root cause is Redis cache invalidation failure.',
      created_at: new Date().toISOString(),
    },
  ];

  it('renders only public comments for reporter role and hides internal tab', () => {
    const onAddComment = vi.fn();
    render(
      <CommentSection
        comments={mockComments}
        userRole="reporter"
        onAddComment={onAddComment}
      />
    );

    // Public comment should be visible
    expect(screen.getByText(/we are investigating your reported issue/i)).toBeInTheDocument();

    // Internal note must NOT be visible
    expect(screen.queryByText(/Root cause is Redis/i)).not.toBeInTheDocument();

    // Internal Notes tab button must NOT exist for reporter
    expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
  });

  it('renders internal tab and warning banner for staff role', () => {
    const onAddComment = vi.fn();
    render(
      <CommentSection
        comments={mockComments}
        userRole="agent"
        onAddComment={onAddComment}
      />
    );

    // Internal notes tab exists for staff
    const internalTab = screen.getByText(/Internal Notes/i);
    expect(internalTab).toBeInTheDocument();

    // Switch to Internal tab
    fireEvent.click(internalTab);

    // Warning banner should be present
    expect(screen.getByText(/Staff Only Area/i)).toBeInTheDocument();

    // Internal note is now visible
    expect(screen.getByText(/Root cause is Redis/i)).toBeInTheDocument();
  });
});
