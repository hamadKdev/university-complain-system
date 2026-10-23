import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckSquare,
  ShieldCheck,
  Users,
  Building2,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  HelpCircle,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
        { label: 'Complaints', to: '/admin/complaints', icon: FileText },
        { label: 'AI Approvals', to: '/admin/approvals', icon: Sparkles },
        { label: 'User Directory', to: '/admin/users', icon: Users },
        { label: 'Departments', to: '/admin/departments', icon: Building2 },
        { label: 'Notifications', to: '/notifications', icon: Bell },
      ];
    }
    if (role === 'staff') {
      return [
        { label: 'Staff Hub', to: '/staff', icon: LayoutDashboard },
        { label: 'Work Queue', to: '/staff/queue', icon: CheckSquare },
        { label: 'Notifications', to: '/notifications', icon: Bell },
      ];
    }
    if (role === 'student') {
      return [
        { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
        { label: 'Submit Ticket', to: '/student/submit', icon: PlusCircle },
        { label: 'My Complaints', to: '/student/complaints', icon: FileText },
        { label: 'Notifications', to: '/notifications', icon: Bell },
      ];
    }
    return [];
  };

  const links = getNavLinks();

  const roleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-indigo-500/15 border-indigo-500/30', text: 'text-indigo-300', label: 'Administrator' },
    staff: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-300', label: 'Technician Staff' },
    student: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-300', label: 'Student' },
  };

  const currentRoleCfg = role && roleColors[role] ? roleColors[role] : null;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-[#0b1328]/95 backdrop-blur-2xl border-r border-[#19274c]/80 shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header matching reference screenshot logo block */}
      <div className="h-18 flex items-center justify-between px-5 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center p-0.5 shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080e22] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                CampusResolve <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {role === 'admin'
                  ? 'Administration Suite'
                  : role === 'staff'
                  ? 'Technician Workspace'
                  : 'Student Grievance Portal'}
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors hidden md:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Tag & Department Info */}
      {!collapsed && currentRoleCfg && (
        <div className="px-5 py-3 border-b border-white/[0.04] bg-[#0e1732]/60">
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentRoleCfg.bg} ${currentRoleCfg.text}`}
            >
              {currentRoleCfg.label}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">Live v2.4</span>
          </div>
          {user?.department_name && (
            <p className="text-[11px] text-slate-300 mt-1.5 truncate">
              Dept: <strong className="text-cyan-300 font-medium">{user.department_name}</strong>
            </p>
          )}
        </div>
      )}

      {/* Navigation Links with Right Chevron arrows as in Reference Image */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5">
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Navigation
          </div>
        )}
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/student' || item.to === '/staff' || item.to === '/admin'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'sidebar-active text-cyan-300 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all opacity-70" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Card Footer matching reference screenshot (Alex Martin) */}
      <div className="p-3 border-t border-white/[0.06] bg-[#090f23]/90">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[#121d3a] border border-white/[0.08] shadow-md ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-cyan-500/30 shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'Campus Operator'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'user@campus.edu'}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
            title="Sign out of console"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
