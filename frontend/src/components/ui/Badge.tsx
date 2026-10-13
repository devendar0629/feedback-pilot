import React from 'react';
import { FeedbackPriority, FeedbackSentiment, FeedbackStatus } from '../../types';

interface BadgeProps {
  type: 'status' | 'priority' | 'sentiment' | 'role';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = value;

  if (type === 'status') {
    switch (value as FeedbackStatus) {
      case 'submitted':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Submitted';
        break;
      case 'under_review':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Under Review';
        break;
      case 'assigned':
        colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        label = 'Assigned';
        break;
      case 'in_progress':
        colorStyles = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'In Progress';
        break;
      case 'awaiting_information':
        colorStyles = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'Awaiting Info';
        break;
      case 'resolved':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Resolved';
        break;
      case 'closed':
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-300';
        label = 'Closed';
        break;
      case 'reopened':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Reopened';
        break;
    }
  } else if (type === 'priority') {
    switch (value as FeedbackPriority) {
      case 'low':
        colorStyles = 'bg-slate-50 text-slate-600 border-slate-200';
        label = 'Low';
        break;
      case 'medium':
        colorStyles = 'bg-sky-50 text-sky-700 border-sky-200';
        label = 'Medium';
        break;
      case 'high':
        colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
        label = 'High';
        break;
      case 'critical':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
        label = 'Critical';
        break;
    }
  } else if (type === 'sentiment') {
    switch (value as FeedbackSentiment) {
      case 'positive':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Positive';
        break;
      case 'neutral':
        colorStyles = 'bg-slate-100 text-slate-600 border-slate-200';
        label = 'Neutral';
        break;
      case 'negative':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Negative';
        break;
      case 'mixed':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Mixed';
        break;
    }
  } else if (type === 'role') {
    switch (value) {
      case 'administrator':
        colorStyles = 'bg-purple-100 text-purple-800 border-purple-200 font-medium';
        label = 'Admin';
        break;
      case 'agent':
        colorStyles = 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
        label = 'Agent';
        break;
      case 'reporter':
        colorStyles = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        label = 'Reporter';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles} ${className}`}
    >
      {label}
    </span>
  );
};
