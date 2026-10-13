import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { publicApi } from '../api/public';
import { StatusStepper } from '../components/feedback/StatusStepper';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PublicTrackingResponse } from '../types';

export const PublicTrackPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    reference_number?: string;
    tracking_secret?: string;
  } | null;

  const [refInput, setRefInput] = useState(state?.reference_number || '');
  const [secretInput, setSecretInput] = useState(state?.tracking_secret || '');
  const [ticketData, setTicketData] = useState<PublicTrackingResponse | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  const lookupMutation = useMutation({
    mutationFn: (credentials: { reference_number: string; tracking_secret: string }) =>
      publicApi.trackFeedback(credentials),
    onSuccess: (data) => {
      setTicketData(data);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: {
      reference_number: string;
      tracking_secret: string;
      content: string;
      author_name?: string;
    }) => publicApi.addPublicComment(data),
    onSuccess: () => {
      setReplyContent('');
      // Re-fetch ticket updates
      lookupMutation.mutate({
        reference_number: refInput,
        tracking_secret: secretInput,
      });
    },
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refInput.trim() || !secretInput.trim()) return;
    lookupMutation.mutate({
      reference_number: refInput.trim(),
      tracking_secret: secretInput.trim(),
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !ticketData) return;
    replyMutation.mutate({
      reference_number: refInput.trim(),
      tracking_secret: secretInput.trim(),
      content: replyContent.trim(),
      author_name: replyAuthor.trim() || 'Reporter',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure Status Tracker
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Track Feedback Resolution</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Enter your reference number and tracking key to inspect live status, SLA milestones, and public responses.
        </p>
      </div>

      {/* Lookup Card Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs mb-8">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference Number
            </label>
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. FP-2026-X8K9M2"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              required
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Secret Tracking Key
            </label>
            <input
              type="text"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="e.g. tr_..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              required
            />
          </div>

          <Button type="submit" isLoading={lookupMutation.isPending} className="w-full sm:w-auto shrink-0">
            <Search className="w-4 h-4 mr-1.5" />
            Lookup Status
          </Button>
        </form>

        {lookupMutation.isError && (
          <Alert type="error" className="mt-4">
            {(lookupMutation.error as any)?.response?.data?.detail ||
              'Invalid reference number or secret tracking key. Please verify your credentials.'}
          </Alert>
        )}
      </div>

      {/* Ticket Details View */}
      {ticketData && (
        <div className="flex flex-col gap-6">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {ticketData.reference_number}
                  </span>
                  <Badge type="status" value={ticketData.status} />
                  <Badge type="priority" value={ticketData.priority} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{ticketData.title}</h2>
              </div>

              <div className="text-right text-xs text-slate-500">
                <span className="flex items-center gap-1 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Submitted: {new Date(ticketData.created_at).toLocaleDateString()}
                </span>
                {ticketData.department_name && (
                  <span className="block mt-0.5">
                    Assigned: <strong>{ticketData.department_name}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Status Stepper Progression */}
            <div className="my-6">
              <StatusStepper currentStatus={ticketData.status} />
            </div>

            {/* Description & Location */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 mb-6">
              <p className="whitespace-pre-wrap leading-relaxed">{ticketData.description}</p>
              {ticketData.location && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 pt-3 border-t border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location: {ticketData.location}</span>
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Lifecycle & Activity Timeline
              </h4>
              <div className="border-l-2 border-indigo-100 pl-4 space-y-4">
                {ticketData.timeline.map((step) => (
                  <div key={step.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 capitalize">
                        {step.to_status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(step.created_at).toLocaleString()}
                      </span>
                    </div>
                    {step.reason && (
                      <p className="text-xs text-slate-600 mt-0.5">{step.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Public Responses & Conversation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Public Responses ({ticketData.public_comments.length})
            </h3>

            {/* Comments List */}
            <div className="my-6 flex flex-col gap-3">
              {ticketData.public_comments.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-400">
                  No public updates posted yet. An assigned agent will respond here shortly.
                </p>
              ) : (
                ticketData.public_comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-900 text-xs">
                        {comment.author_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Public Reply Form */}
            <form onSubmit={handleReply} className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Your Name (e.g. Reporter)"
                  className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Post a reply or provide requested information to staff..."
                rows={3}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={replyMutation.isPending} disabled={!replyContent.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
