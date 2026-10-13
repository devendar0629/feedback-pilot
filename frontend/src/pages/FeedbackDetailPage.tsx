import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Send,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { feedbacksApi } from '../api/feedbacks';
import { AIAnalysisCard } from '../components/feedback/AIAnalysisCard';
import { AssignmentModal } from '../components/feedback/AssignmentModal';
import { CommentSection } from '../components/feedback/CommentSection';
import { StatusStepper } from '../components/feedback/StatusStepper';
import { TransitionModal } from '../components/feedback/TransitionModal';
import { Sidebar } from '../components/layout/Sidebar';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { FeedbackStatus } from '../types';

export const FeedbackDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Queries
  const {
    data: feedback,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => feedbacksApi.getById(id!),
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: adminApi.listDepartments,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'users', 'agents'],
    queryFn: () => adminApi.listUsers({ role: 'agent' }),
  });

  // Mutations
  const transitionMutation = useMutation({
    mutationFn: ({ targetStatus, reason }: { targetStatus: FeedbackStatus; reason: string }) =>
      feedbacksApi.transitionStatus(id!, targetStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: { department_id?: string; assigned_to_id?: string; note?: string }) =>
      feedbacksApi.assign(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const applyAIMutation = useMutation({
    mutationFn: () =>
      feedbacksApi.applyAI(id!, {
        apply_category: true,
        apply_department: true,
        apply_priority: true,
        apply_sentiment: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const retryAIMutation = useMutation({
    mutationFn: () => adminApi.retryAI(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ content, isInternal }: { content: string; isInternal: boolean }) =>
      feedbacksApi.addComment(id!, { content, is_internal: isInternal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading ticket details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-8">
          <Alert type="error" title="Access Denied or Not Found">
            {(error as any)?.response?.data?.detail || 'Ticket not found or unauthorized.'}
          </Alert>
        </main>
      </div>
    );
  }

  const isStaff = user?.role === 'administrator' || user?.role === 'agent';

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto overflow-x-hidden">
        {/* Ticket Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                  {feedback.reference_number}
                </span>
                <Badge type="status" value={feedback.status} />
                <Badge type="priority" value={feedback.priority} />
                {feedback.sentiment && <Badge type="sentiment" value={feedback.sentiment} />}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{feedback.title}</h1>
            </div>

            {/* Action Buttons for Staff */}
            {isStaff && (
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignOpen(true)}
                  className="text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Assign
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsTransitionOpen(true)}
                  className="text-xs"
                >
                  Change Status
                </Button>
              </div>
            )}
          </div>

          {/* Stepper */}
          <div className="py-4">
            <StatusStepper currentStatus={feedback.status} />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Department</span>
              <strong className="text-slate-800 text-sm">{feedback.department_name || 'Unassigned'}</strong>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Assigned Agent</span>
              <strong className="text-slate-800 text-sm">{feedback.assigned_to_name || 'Unassigned'}</strong>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Category</span>
              <strong className="text-slate-800 text-sm">{feedback.category_name || 'General'}</strong>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Reporter</span>
              <strong className="text-slate-800 text-sm">
                {feedback.reporter_name || (feedback.is_anonymous ? 'Anonymous' : 'Registered User')}
              </strong>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Complaint Description
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {feedback.description}
            </div>

            {feedback.location && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location: {feedback.location}
              </div>
            )}
          </div>
        </div>

        {/* Gemini AI Triage Card (Visible to Staff) */}
        {isStaff && (
          <div className="mb-6">
            <AIAnalysisCard
              aiAnalysis={feedback.ai_analysis}
              onApplySuggestions={async () => {
                await applyAIMutation.mutateAsync();
              }}
              onRetry={async () => {
                await retryAIMutation.mutateAsync();
              }}
              isApplying={applyAIMutation.isPending}
              isRetrying={retryAIMutation.isPending}
            />
          </div>
        )}

        {/* Comments & Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CommentSection
              comments={feedback.comments}
              userRole={user?.role}
              onAddComment={async (content, isInternal) => {
                await commentMutation.mutateAsync({ content, isInternal });
              }}
              isLoading={commentMutation.isPending}
            />
          </div>

          {/* Status History Timeline Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Status Audit History
            </h3>

            <div className="border-l-2 border-slate-200 pl-3.5 space-y-4">
              {feedback.status_history.map((step) => (
                <div key={step.id} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-bold text-slate-800 capitalize">
                      {step.to_status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    By: {step.changed_by_name || 'System'}
                  </span>
                  {step.reason && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                      {step.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transition Modal */}
        <TransitionModal
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          currentStatus={feedback.status}
          onTransition={async (targetStatus, reason) => {
            await transitionMutation.mutateAsync({ targetStatus, reason });
          }}
          isLoading={transitionMutation.isPending}
        />

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          departments={departments}
          agents={agents}
          currentDepartmentId={feedback.department_id}
          currentAgentId={feedback.assigned_to_id}
          onAssign={async (data) => {
            await assignMutation.mutateAsync(data);
          }}
          isLoading={assignMutation.isPending}
        />
      </main>
    </div>
  );
};
