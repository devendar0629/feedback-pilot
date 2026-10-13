import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bot,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { isAdmin, user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-6">
        {/* Workspace links */}
        <div>
          <p className="px-3.5 text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
            Workspace
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Overview
            </NavLink>
            <NavLink to="/feedbacks" className={linkClass}>
              <FileText className="w-4 h-4 shrink-0" />
              Feedback Queue
            </NavLink>
          </nav>
        </div>

        {/* Administration links */}
        {isAdmin && (
          <div>
            <p className="px-3.5 text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
              Administration
            </p>
            <nav className="flex flex-col gap-1">
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="w-4 h-4 shrink-0" />
                User Management
              </NavLink>
              <NavLink to="/admin/departments" className={linkClass}>
                <Building2 className="w-4 h-4 shrink-0" />
                Departments & Tags
              </NavLink>
              <NavLink to="/admin/ai-settings" className={linkClass}>
                <Bot className="w-4 h-4 shrink-0" />
                Gemini AI Engine
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User card at bottom */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
