import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { healthService, HealthStatus } from '../../services/healthService';
import { ShieldCheck, LogOut, LayoutDashboard, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    healthService.checkHealth().then((status) => {
      if (isMounted) setHealth(status);
    });

    const interval = setInterval(() => {
      healthService.checkHealth().then((status) => {
        if (isMounted) setHealth(status);
      });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'staff') return '/staff';
    if (role === 'student') return '/student';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090e21]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Brand emblem */}
        <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-[#090e21] rounded-[9px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            CampusResolve <span className="text-cyan-400">AI</span>
          </span>
        </Link>

        {/* Concise nav links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#8c9fc2]">
          <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            How It Works
          </a>
          <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Capabilities
          </a>
          <a href="#approvals" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            AI Approvals
          </a>
          <a href="#overview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Overview
          </a>
        </nav>

        {/* Live status & Primary CTA */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Live API status */}
          <div
            className="hidden sm:flex items-center gap-2 text-xs text-[#8c9fc2] bg-[#121c38]/60 px-2.5 py-1 rounded-full border border-white/5"
            title={
              health?.online
                ? `Backend Online (${health.latencyMs ?? 0}ms)`
                : 'Backend Connection Pending or Offline'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-mono tabular-nums text-[#8c9fc2]">
              {health?.online ? `API Live ${health.latencyMs ?? ''}ms` : 'Connecting...'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#090e21] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all whitespace-nowrap shrink-0 shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="p-2 text-[#8c9fc2] hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#8c9fc2] hover:text-white px-3 py-2 transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#090e21] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all whitespace-nowrap shrink-0 shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
