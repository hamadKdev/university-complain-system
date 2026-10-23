import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { healthService, HealthStatus } from '../../services/healthService';
import { notificationService } from '../../services/notificationService';
import {
  Menu,
  X,
  Bell,
  Search,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Moon,
  Laptop,
  Flag,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AppShell: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [unreadCount, setUnreadCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    healthService.checkHealth().then((status) => {
      if (isMounted) setHealth(status);
    });

    notificationService.getNotifications().then((list) => {
      if (isMounted && Array.isArray(list)) {
        const unread = list.filter((n) => !n.is_read).length;
        setUnreadCount(unread > 0 ? unread : 0);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (role === 'admin') {
      navigate(`/admin/complaints?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (role === 'staff') {
      navigate(`/staff/queue?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/student/complaints?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Top header quick navigation links matching reference image: "Pricing Docs Analytics Profile"
  const getQuickLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Overview', to: '/admin' },
        { label: 'Complaints', to: '/admin/complaints' },
        { label: 'Approvals', to: '/admin/approvals' },
        { label: 'Directory', to: '/admin/users' },
      ];
    }
    if (role === 'staff') {
      return [
        { label: 'Hub', to: '/staff' },
        { label: 'Queue', to: '/staff/queue' },
        { label: 'Notifications', to: '/notifications' },
      ];
    }
    return [
      { label: 'Dashboard', to: '/student' },
      { label: 'Submit', to: '/student/submit' },
      { label: 'My Tickets', to: '/student/complaints' },
      { label: 'Updates', to: '/notifications' },
    ];
  };

  const quickLinks = getQuickLinks();

  return (
    <div className="min-h-screen bg-[#090e21] text-[#f1f5f9] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md flex">
          <div className="w-64 bg-[#0b1328] h-full shadow-2xl relative">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Header matching reference screenshot */}
        <header className="h-18 sticky top-0 z-20 bg-[#090e21]/85 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Navigation Links on Left (as in reference image: Pricing Docs Analytics Profile) */}
            <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <div className="p-1.5 rounded-lg bg-[#14203e] border border-white/10 text-cyan-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`transition-colors hover:text-cyan-400 ${
                    location.pathname === item.to ? 'text-cyan-400 font-bold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Header Zone matching screenshot: Search + Icons + Notification Bell + Avatar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Search Input with ⌘K badge */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-56 lg:w-72 bg-[#121c38] border border-white/10 rounded-full pl-9 pr-12 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md pointer-events-none">
                ⌘K
              </span>
            </form>

            {/* Utility icons matching reference screenshot (theme/display/flag) */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <button
                className="p-2 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                title="Dark theme active"
                aria-label="Theme mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                title="System Display"
                aria-label="Display options"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Bell with Red Badge matching reference screenshot */}
            <Link
              to="/notifications"
              className="p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors relative"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-[#090e21]">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Circular Profile Avatar matching reference screenshot */}
            <div className="flex items-center gap-2 pl-1 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/20 ring-2 ring-white/10">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Floating Settings Gear Button in Bottom Right as seen in reference image */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-11 h-11 rounded-full bg-[#162347] hover:bg-[#1d305f] border border-cyan-500/30 text-cyan-400 shadow-xl shadow-black/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="System Preferences & Connection"
            aria-label="System Settings"
          >
            <Settings className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
          </button>

          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 right-0 w-80 p-5 rounded-2xl bg-[#0e1733] border border-white/10 shadow-2xl backdrop-blur-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Platform Preferences
                  </h4>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>API Server</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {health?.online ? 'Connected' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>AI Triage Agent</span>
                    <span className="text-cyan-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Active Account</span>
                    <span className="text-white font-medium truncate max-w-[140px]">
                      {user?.full_name || user?.email}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-slate-400">Role Authority</span>
                    <span className="text-xs font-bold text-cyan-300 uppercase">
                      {role || 'Student'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
