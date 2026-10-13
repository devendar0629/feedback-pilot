import React, { useState } from 'react';
import { FeedbackStatus } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: FeedbackStatus;
  onTransition: (targetStatus: FeedbackStatus, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const ALLOWED_TARGETS: Record<FeedbackStatus, FeedbackStatus[]> = {
  submitted: ['under_review', 'assigned', 'closed'],
  under_review: ['assigned', 'in_progress', 'awaiting_information', 'resolved', 'closed'],
  assigned: ['in_progress', 'under_review', 'awaiting_information', 'resolved', 'closed'],
  in_progress: ['awaiting_information', 'resolved', 'under_review', 'closed'],
  awaiting_information: ['in_progress', 'under_review', 'resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress', 'assigned', 'under_review'],
};

export const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onTransition,
  isLoading = false,
}) => {
  const allowed = ALLOWED_TARGETS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>(
    allowed[0] || 'under_review'
  );
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onTransition(selectedStatus, reason);
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Ticket Status">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Target Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
          >
            {allowed.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Reason / Transition Note
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this status is being changed..."
            rows={3}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirm Transition
          </Button>
        </div>
      </form>
    </Modal>
  );
};
