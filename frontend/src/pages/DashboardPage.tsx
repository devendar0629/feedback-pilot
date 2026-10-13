import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi } from '../api/analytics';
import { feedbacksApi } from '../api/feedbacks';
import { Sidebar } from '../components/layout/Sidebar';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export const DashboardPage: React.FC = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.getDashboard,
    refetchInterval: 60000,
  });

  const { data: recentFeedbacks } = useQuery({
    queryKey: ['feedbacks', 'recent'],
    queryFn: () => feedbacksApi.list({ page: 1, size: 5 }),
  });

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aggregating live analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
            Failed to load dashboard metrics.
          </div>
        </main>
      </div>
    );
  }

  const { summary, trends, category_distribution, priority_distribution, sentiment_distribution, department_workload } =
    analytics;

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Triage & SLA Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time monitoring of complaint resolution velocity, department workloads, and sentiment trends.
            </p>
          </div>

          <Link
            to="/feedbacks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" />
            View All Tickets
          </Link>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Submissions"
            value={summary.total_submissions}
            subtitle="All logged complaints & reports"
            icon={<Inbox className="w-5 h-5" />}
          />
          <StatCard
            title="Unresolved Tickets"
            value={summary.unresolved_count}
            subtitle={`${summary.new_count} submitted, ${summary.in_progress_count} in-progress`}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            trend={`${Math.round(
              summary.total_submissions > 0
                ? (summary.unresolved_count / summary.total_submissions) * 100
                : 0
            )}% active`}
            trendColor="neutral"
          />
          <StatCard
            title="Resolved Tickets"
            value={summary.resolved_count}
            subtitle={`${summary.closed_count} closed permanently`}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            trend={`${Math.round(
              summary.total_submissions > 0
                ? (summary.resolved_count / summary.total_submissions) * 100
                : 0
            )}% resolved`}
            trendColor="green"
          />
          <StatCard
            title="Avg Resolution Time"
            value={`${summary.avg_resolution_time_hours} hrs`}
            subtitle="From submission to resolved status"
            icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          />
        </div>

        {/* Charts Section: Row 1 Trends and Department Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trends AreaChart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              14-Day Submission & Resolution Trends
            </h3>
            <p className="text-xs text-slate-400 mb-4">Volume of tickets submitted vs tickets resolved</p>

            <div className="h-64 w-full">
              {trends.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Insufficient trend data to display chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total_submissions"
                      name="Submissions"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved_submissions"
                      name="Resolved"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Department Workload BarChart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Department Workload Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Active open tickets per department</p>

            <div className="h-64 w-full">
              {department_workload.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department assignments recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={department_workload}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="department_name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active_count" name="Active Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved_count" name="Resolved Tickets" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Priority, Category & Sentiment Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Priority Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Priority Breakdown
            </h4>
            <div className="h-44 w-full">
              {priority_distribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priority_distribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      label={({ name, percent }: any) =>
                        `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                      }
                    >
                      {priority_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Sentiment Distribution (AI)
            </h4>
            <div className="h-44 w-full">
              {sentiment_distribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No sentiment data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentiment_distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Top Complaint Categories
            </h4>
            <div className="flex flex-col gap-2.5">
              {category_distribution.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No categories assigned</div>
              ) : (
                category_distribution.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{cat.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Tickets Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Feedback Submissions</h3>
            <Link
              to="/feedbacks"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Reference</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFeedbacks?.items.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                      <Link to={`/feedbacks/${fb.id}`}>{fb.reference_number}</Link>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 max-w-xs truncate">
                      <Link to={`/feedbacks/${fb.id}`}>{fb.title}</Link>
                    </td>
                    <td className="py-3 px-3">
                      <Badge type="status" value={fb.status} />
                    </td>
                    <td className="py-3 px-3">
                      <Badge type="priority" value={fb.priority} />
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {fb.department_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
