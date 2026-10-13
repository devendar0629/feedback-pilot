import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Compass,
  FileText,
  LogOut,
  PlusCircle,
  Search,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                FeedbackPilot
              </span>
            </Link>

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="/submit"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all"
              >
                <PlusCircle className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                Submit Feedback
              </Link>
              <Link
                to="/track"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all"
              >
                <Search className="w-4 h-4 text-slate-400" />
                Track Status
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    to="/feedbacks"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all"
                  >
                    Queue
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User & Auth Action Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* Notifications Link */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadData && unreadData.unread_count > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                  )}
                </Link>

                {/* User Profile Pill */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-800">
                      {user?.full_name}
                    </span>
                    <Badge type="role" value={user?.role || 'reporter'} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin/users"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            User Management
                          </Link>
                          <Link
                            to="/admin/ai-settings"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600"
                          >
                            <Compass className="w-4 h-4 text-indigo-600" />
                            AI Analytics & Settings
                          </Link>
                        </>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/track"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Track Feedback
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98]"
                >
                  Staff Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
