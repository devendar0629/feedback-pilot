import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Clock,
  Compass,
  FileCheck2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/90 via-white to-slate-50 pt-24 pb-32 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide mb-8 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            AI-POWERED FEEDBACK & COMPLAINT TRIAGE
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Turn Customer Grievances into Rapid, Accountable{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              Resolutions
            </span>
          </h1>

          <p className="mt-7 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            FeedbackPilot auto-classifies public complaints with Google Gemini, assigns tickets to
            departments, strictly isolates internal notes, and guarantees transparent tracking.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              Submit Feedback
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-2 transition-all hover:border-slate-400 text-sm"
            >
              <Search className="w-4 h-4 text-slate-400" />
              Track with Reference
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-all hover:bg-slate-950 text-sm"
            >
              Staff Portal
            </Link>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-sky-200/20 blur-[130px] rounded-full pointer-events-none -z-0" />
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2.5">
              Enterprise Grade Platform
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for Speed, Privacy, and Accountable Triage
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-indigo-200 shadow-2xs hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xs group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2.5">Gemini AI Classification</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Automatically extracts priority, sentiment, and urgency scores. Recommends matching
                departments with human-in-the-loop review.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-emerald-200 shadow-2xs hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xs group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2.5">Dual Verification Tracking</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Submissions generate a reference code and a secret tracking token. Prevents
                ticket enumeration attacks against anonymous complaints.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-purple-200 shadow-2xs hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xs group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2.5">Strict Note Isolation</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Private staff notes and triage debates are strictly hidden from reporters and public
                tracking. Only official public responses are displayed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">FeedbackPilot</span>
            <span className="text-slate-500">— Full-Stack AI Feedback Management</span>
          </div>
          <div className="text-slate-500">
            Powered by FastAPI, SQLAlchemy, PostgreSQL, and Google Gen AI SDK
          </div>
        </div>
      </footer>
    </div>
  );
};
