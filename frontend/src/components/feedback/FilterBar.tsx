import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Department, FeedbackPriority, FeedbackStatus } from '../../types';
import { Button } from '../ui/Button';

interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  status?: FeedbackStatus;
  onStatusChange: (status?: FeedbackStatus) => void;
  priority?: FeedbackPriority;
  onPriorityChange: (priority?: FeedbackPriority) => void;
  departmentId?: string;
  onDepartmentChange: (departmentId?: string) => void;
  departments: Department[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  departmentId,
  onDepartmentChange,
  departments,
  onReset,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by reference, title, description, or reporter..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status || ''}
          onChange={(e) => onStatusChange(e.target.value ? (e.target.value as FeedbackStatus) : undefined)}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_information">Awaiting Info</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>

        <select
          value={priority || ''}
          onChange={(e) =>
            onPriorityChange(e.target.value ? (e.target.value as FeedbackPriority) : undefined)
          }
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={departmentId || ''}
          onChange={(e) => onDepartmentChange(e.target.value || undefined)}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <Button variant="ghost" size="sm" onClick={onReset} title="Reset filters">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
};
