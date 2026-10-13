import React from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AIAnalysis } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AIAnalysisCardProps {
  aiAnalysis?: AIAnalysis | null;
  onApplySuggestions?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  isApplying?: boolean;
  isRetrying?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  aiAnalysis,
  onApplySuggestions,
  onRetry,
  isApplying = false,
  isRetrying = false,
}) => {
  if (!aiAnalysis) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
        <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">No AI analysis data available.</p>
      </div>
    );
  }

  const { status, urgency_score, summary, suggested_next_action, confidence_score } = aiAnalysis;

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-100/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-indigo-100/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shadow-indigo-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Gemini AI Triage
              <span className="text-xs font-normal text-slate-500">
                ({aiAnalysis.model_name || 'gemini-2.5-flash'})
              </span>
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Status: <strong className="uppercase">{status}</strong></span>
              {aiAnalysis.duration_ms && (
                <span>• {aiAnalysis.duration_ms}ms</span>
              )}
            </div>
          </div>
        </div>

        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            isLoading={isRetrying}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Re-analyze
          </Button>
        )}
      </div>

      {/* Body content based on status */}
      {status === 'pending' || status === 'processing' ? (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <Clock className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
          <p className="text-sm text-slate-600 font-medium">
            AI analysis in progress...
          </p>
          <p className="text-xs text-slate-400">Classifying priority, sentiment, and department.</p>
        </div>
      ) : status === 'failed' ? (
        <div className="py-4 text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-1.5" />
          <p className="text-sm text-rose-700 font-semibold">AI Analysis Failed</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {aiAnalysis.error_message || 'Could not reach model or parse response.'}
          </p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              isLoading={isRetrying}
              className="mt-3 text-xs"
            >
              Retry Analysis
            </Button>
          )}
        </div>
      ) : status === 'skipped' ? (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-600 font-medium">AI Analysis Skipped</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {aiAnalysis.error_message || 'AI is disabled in system configuration.'}
          </p>
        </div>
      ) : (
        /* Completed Analysis view */
        <div className="mt-4 flex flex-col gap-4">
          {/* Urgency Gauge & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
              <span className="text-xs text-slate-500 font-medium block mb-1">Urgency Score</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (urgency_score || 0) > 75
                        ? 'bg-rose-500'
                        : (urgency_score || 0) > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${urgency_score || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-800">{urgency_score ?? 50}/100</span>
              </div>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
              <span className="text-xs text-slate-500 font-medium block mb-1">Sentiment</span>
              <Badge type="sentiment" value={aiAnalysis.suggested_sentiment || 'neutral'} />
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
              <span className="text-xs text-slate-500 font-medium block mb-1">Rec. Priority</span>
              <Badge type="priority" value={aiAnalysis.suggested_priority || 'medium'} />
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
              <span className="text-xs text-slate-500 font-medium block mb-1">Confidence</span>
              <span className="text-sm font-bold text-indigo-700">
                {Math.round((confidence_score || 0.85) * 100)}%
              </span>
            </div>
          </div>

          {/* Department & Category Recommendations */}
          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-50 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Suggested Department:</span>{' '}
              <strong className="text-slate-800">
                {aiAnalysis.suggested_department_name || 'None'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Suggested Category:</span>{' '}
              <strong className="text-slate-800">
                {aiAnalysis.suggested_category_name || 'None'}
              </strong>
            </div>
          </div>

          {/* Executive Summary */}
          {summary && (
            <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-50">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                AI Executive Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Next Action */}
          {suggested_next_action && (
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-indigo-950 block">Recommended Action</span>
                <p className="text-xs text-indigo-900 mt-0.5">{suggested_next_action}</p>
              </div>
            </div>
          )}

          {/* Apply button */}
          {onApplySuggestions && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="primary"
                onClick={onApplySuggestions}
                isLoading={isApplying}
                className="text-xs shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Apply AI Suggestions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
