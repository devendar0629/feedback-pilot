import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

export const SubmissionSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    reference_number?: string;
    tracking_secret?: string;
    title?: string;
  } | null;

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const referenceNumber = state?.reference_number || 'FP-2026-DEMO99';
  const trackingSecret = state?.tracking_secret || 'tr_demo_secret_key_12345';
  const title = state?.title || 'Submitted Ticket';

  const copyToClipboard = (text: string, isSecret: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xs shadow-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Feedback Submitted Successfully!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your submission is safely registered in our database. Gemini AI is currently reviewing the complaint.
        </p>

        {/* Warning Alert */}
        <Alert type="warning" className="my-6 text-left">
          <strong>Important Security Notice:</strong> Please copy and securely store both your{' '}
          <strong>Reference Number</strong> and <strong>Secret Tracking Key</strong>. Because
          tickets can be anonymous, both credentials are strictly required to track progress or submit replies.
        </Alert>

        {/* Credentials Box */}
        <div className="flex flex-col gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-8">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Reference Number
            </span>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="font-mono text-base font-bold text-indigo-700">
                {referenceNumber}
              </span>
              <button
                onClick={() => copyToClipboard(referenceNumber, false)}
                className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                title="Copy Reference"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Secret Tracking Key
            </span>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="font-mono text-xs sm:text-sm text-slate-800 break-all select-all">
                {trackingSecret}
              </span>
              <button
                onClick={() => copyToClipboard(trackingSecret, true)}
                className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                title="Copy Key"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/track"
            state={{ reference_number: referenceNumber, tracking_secret: trackingSecret }}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            Track Status Now
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-3 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
