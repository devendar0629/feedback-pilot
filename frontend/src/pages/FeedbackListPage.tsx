import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { feedbacksApi } from '../api/feedbacks';
import { FilterBar } from '../components/feedback/FilterBar';
import { Sidebar } from '../components/layout/Sidebar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FeedbackPriority, FeedbackStatus } from '../types';

export const FeedbackListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FeedbackStatus | undefined>(undefined);
  const [priority, setPriority] = useState<FeedbackPriority | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);

  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: adminApi.listDepartments,
  });

  const { data: feedbackData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['feedbacks', { page, search, status, priority, departmentId }],
    queryFn: () =>
      feedbacksApi.list({
        page,
        size: 15,
        search: search || undefined,
        status,
        priority,
        department_id: departmentId,
      }),
    placeholderData: keepPreviousData,
  });

  const handleResetFilters = () => {
    setSearch('');
    setStatus(undefined);
    setPriority(undefined);
    setDepartmentId(undefined);
    setPage(1);
  };

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Feedback & Triage Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Filter, triage, assign, and track reported customer complaints.
            </p>
          </div>

          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            New Public Feedback
          </Link>
        </div>

        {/* Filter Bar */}
        <FilterBar
          search={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          status={status}
          onStatusChange={(st) => {
            setStatus(st);
            setPage(1);
          }}
          priority={priority}
          onPriorityChange={(p) => {
            setPriority(p);
            setPage(1);
          }}
          departmentId={departmentId}
          onDepartmentChange={(d) => {
            setDepartmentId(d);
            setPage(1);
          }}
          departments={departments}
          onReset={handleResetFilters}
        />

        {/* Feedbacks Table Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading tickets...</p>
            </div>
          ) : feedbackData?.items.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Tickets Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No feedback records match the current filter criteria or queue.
              </p>
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="mt-4 text-xs">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Title & Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Department / Agent</th>
                      <th className="py-3 px-4">AI Triage</th>
                      <th className="py-3 px-4 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feedbackData?.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          <Link to={`/feedbacks/${item.id}`}>{item.reference_number}</Link>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <Link to={`/feedbacks/${item.id}`} className="block">
                            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                              {item.reporter_name || (item.is_anonymous ? 'Anonymous Guest' : 'User')}
                            </span>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge type="status" value={item.status} />
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge type="priority" value={item.priority} />
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">
                            {item.department_name || 'Unassigned'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {item.assigned_to_name ? `Agent: ${item.assigned_to_name}` : 'No Agent'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.ai_status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              <Sparkles className="w-3 h-3" /> Triaged
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 capitalize">
                              {item.ai_status || 'Pending'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Showing <strong>{(page - 1) * 15 + 1}</strong> to{' '}
                  <strong>{Math.min(page * 15, feedbackData?.total || 0)}</strong> of{' '}
                  <strong>{feedbackData?.total}</strong> tickets
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-xs font-semibold text-slate-700 px-2">
                    Page {page} of {feedbackData?.pages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isPlaceholderData || page >= (feedbackData?.pages || 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
