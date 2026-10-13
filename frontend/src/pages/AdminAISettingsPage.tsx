import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Power,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { Sidebar } from '../components/layout/Sidebar';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';

export const AdminAISettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modelInput, setModelInput] = useState('');

  const { data: aiStats, isLoading } = useQuery({
    queryKey: ['admin', 'ai-stats'],
    queryFn: adminApi.getAIStats,
    refetchInterval: 30000,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin', 'audit-logs', 'ai'],
    queryFn: () => adminApi.getAuditLogs({ limit: 15 }),
  });

  const toggleAIMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      adminApi.updateAISettings({
        ai_enabled: enabled,
        model_name: modelInput || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading Gemini configuration...</p>
          </div>
        </main>
      </div>
    );
  }

  const isEnabled = aiStats?.ai_enabled ?? true;

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto overflow-x-hidden">
        <div className="pb-6 border-b border-slate-200 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-indigo-600" />
            Gemini AI Integration & Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated classification models, bounded workers, and inspect real-time accuracy metrics.
          </p>
        </div>

        {/* AI Control Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                Automated Processing Status
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Gemini Background Triage Engine
                {isEnabled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <Power className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    <Power className="w-3 h-3 text-slate-400" /> Disabled
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                When enabled, every submitted ticket is automatically queued for sentiment analysis, urgency
                scoring, and department routing recommendations.
              </p>
            </div>

            <Button
              variant={isEnabled ? 'danger' : 'primary'}
              onClick={() => toggleAIMutation.mutate(!isEnabled)}
              isLoading={toggleAIMutation.isPending}
              className="self-start sm:self-auto shrink-0"
            >
              <Power className="w-4 h-4 mr-2" />
              {isEnabled ? 'Disable AI Engine' : 'Enable AI Engine'}
            </Button>
          </div>

          {/* Model Config Row */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Current Model Identifier</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {aiStats?.current_model || 'gemini-2.5-flash'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="Override model ID (e.g. gemini-2.5-pro)"
                className="px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono w-60"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (modelInput.trim()) toggleAIMutation.mutate(isEnabled);
                }}
                disabled={!modelInput.trim()}
                isLoading={toggleAIMutation.isPending}
                className="text-xs"
              >
                Update
              </Button>
            </div>
          </div>
        </div>

        {/* AI Performance Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tickets Analyzed"
            value={aiStats?.total_analyzed ?? 0}
            subtitle="Processed by background worker"
            icon={<Bot className="w-5 h-5" />}
          />
          <StatCard
            title="Success Rate"
            value={`${aiStats?.success_rate_percentage ?? 100}%`}
            subtitle={`${aiStats?.completed_count ?? 0} completed successfully`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            trend={`${aiStats?.failed_count ?? 0} failed`}
            trendColor={aiStats?.failed_count ? 'red' : 'green'}
          />
          <StatCard
            title="Avg Processing Latency"
            value={`${aiStats?.avg_duration_ms ?? 0} ms`}
            subtitle="Round-trip structured inference"
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Skipped / Fallback"
            value={aiStats?.skipped_count ?? 0}
            subtitle="When disabled or mock active"
            icon={<Zap className="w-5 h-5 text-amber-600" />}
          />
        </div>

        {/* Audit Trail Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Recent Audit & Triage Events
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Action</th>
                  <th className="py-2.5 px-3">Actor Email</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.user_email || 'System / Guest'}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-sm truncate">
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
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
