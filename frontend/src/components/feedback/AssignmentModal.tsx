import React, { useState } from 'react';
import { Department, User } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  agents: User[];
  currentDepartmentId?: string | null;
  currentAgentId?: string | null;
  onAssign: (data: { department_id?: string; assigned_to_id?: string; note?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  departments,
  agents,
  currentDepartmentId,
  currentAgentId,
  onAssign,
  isLoading = false,
}) => {
  const [departmentId, setDepartmentId] = useState(currentDepartmentId || '');
  const [agentId, setAgentId] = useState(currentAgentId || '');
  const [note, setNote] = useState('');

  // Filter agents by selected department if selected
  const filteredAgents = departmentId
    ? agents.filter((a) => !a.department_id || a.department_id === departmentId)
    : agents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAssign({
      department_id: departmentId || undefined,
      assigned_to_id: agentId || undefined,
      note: note || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Ticket">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setAgentId(''); // Reset selected agent
            }}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select Department --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Agent
          </label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Unassigned / Any Agent --</option>
            {filteredAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name} ({agent.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Assignment Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add handover instructions or ticket notes..."
            rows={2}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Assign Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};
