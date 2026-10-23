import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { motion } from 'motion/react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalCount = complaints.length;
  const underReviewCount = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'under_review'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'in_progress' || c.status === 'assigned'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  const studentActivityData = [
    { month: 'Jan', submitted: Math.max(1, Math.round(totalCount * 0.3)), resolved: Math.max(1, Math.round(resolvedCount * 0.2)) },
    { month: 'Feb', submitted: Math.max(3, Math.round(totalCount * 0.7)), resolved: Math.max(2, Math.round(resolvedCount * 0.5)) },
    { month: 'Mar', submitted: Math.max(2, Math.round(totalCount * 0.5)), resolved: Math.max(2, Math.round(resolvedCount * 0.6)) },
    { month: 'Apr', submitted: Math.max(4, Math.round(totalCount * 0.9)), resolved: Math.max(3, Math.round(resolvedCount * 0.8)) },
    { month: 'May', submitted: Math.max(3, totalCount), resolved: Math.max(3, resolvedCount) },
    { month: 'Jun', submitted: Math.max(5, totalCount + 2), resolved: Math.max(4, resolvedCount + 1) },
  ];

  const recentComplaints = complaints.slice(0, 6);

  return (
    <div className="space-y-6">
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <>
          {/* Main 5-Card Dashboard Grid matching Reference Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card 1: Student Intake Spotlight Card (lg:col-span-5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="dash-card dash-card-glow lg:col-span-5 p-7 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="relative z-10 max-w-[65%] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Student Portal
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  Grievance Intake
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Transparent campus complaint intake. AI categorizes your issue and routes it directly to department technicians.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => navigate('/student/submit')}
                    className="px-4 py-2.5 rounded-xl bg-white text-[#090e21] hover:bg-slate-100 font-semibold text-xs transition-all shadow-md shadow-black/30 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-cyan-600" />
                    <span>File New Issue</span>
                  </button>
                  <button
                    onClick={() => navigate('/student/complaints')}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1a2b53] hover:bg-[#223668] border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-colors"
                  >
                    My History
                  </button>
                </div>
              </div>

              {/* Student Laptop / Workstation SVG Illustration matching reference screenshot */}
              <div className="absolute -right-2 bottom-0 w-44 sm:w-52 h-44 sm:h-52 opacity-90 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <ellipse cx="100" cy="180" rx="70" ry="12" fill="#080e22" opacity="0.6" />
                  <rect x="50" y="125" width="130" height="6" rx="3" fill="#223664" />
                  <rect x="70" y="131" width="6" height="48" fill="#18274a" />
                  <rect x="155" y="131" width="6" height="48" fill="#18274a" />
                  <rect x="90" y="70" width="60" height="42" rx="4" fill="#0c1630" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="95" y="75" width="50" height="32" rx="2" fill="#122045" />
                  <line x1="100" y1="84" x2="135" y2="84" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="100" y1="92" x2="125" y2="92" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="58" cy="72" r="14" fill="#cbd5e1" />
                  <path d="M 47 72 A 12 12 0 0 1 69 72" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 44 94 Q 58 86 72 94 L 70 135 L 46 135 Z" fill="#38bdf8" opacity="0.85" />
                  <circle cx="160" cy="65" r="2" fill="#38bdf8" className="animate-pulse" />
                </svg>
              </div>
            </motion.div>

            {/* Card 2: My Submitted Tickets with Sparkline Curve (lg:col-span-3.5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="dash-card dash-card-glow lg:col-span-3.5 p-7 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-medium tracking-wide text-slate-400">
                  Total Filed Tickets
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                    {totalCount}
                  </span>
                  <span className="text-xs text-slate-400">all time</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  <TrendingUp className="w-3 h-3" />
                  <span className="tabular-nums">+100% transparent</span>
                </div>
              </div>

              {/* Glowing Curved Sparkline matching reference screenshot */}
              <div className="mt-4 h-20 w-full overflow-hidden">
                <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="studentSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 45 C 30 45, 45 25, 70 35 C 95 45, 115 15, 140 25 C 165 35, 180 50, 200 40 L 200 60 L 0 60 Z"
                    fill="url(#studentSparkGrad)"
                  />
                  <path
                    d="M 0 45 C 30 45, 45 25, 70 35 C 95 45, 115 15, 140 25 C 165 35, 180 50, 200 40"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Card 3: Resolved Grievances with Vertical Bars (lg:col-span-3.5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="dash-card dash-card-glow lg:col-span-3.5 p-7 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-medium tracking-wide text-slate-400">
                  Resolved Tickets
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                    {resolvedCount}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">({resolutionRate}%)</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="tabular-nums">Confirmed Closed</span>
                </div>
              </div>

              {/* Glowing Vertical Rounded Bars matching reference screenshot */}
              <div className="mt-4 flex items-end justify-between gap-2 h-20 px-2 pb-1">
                {[30, 50, 40, 70, 60, 90, 80, 60].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-3 rounded-full bg-gradient-to-t from-emerald-500/60 via-cyan-400/80 to-white/95 transition-all duration-300 hover:brightness-125"
                    style={{ height: `${(val / 100) * 60}px` }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Card 4: Ticket Tracking & Resolution Timeline (Dual-layer Spline AreaChart) (lg:col-span-7) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="dash-card dash-card-glow lg:col-span-7 p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Resolution Activity Insights
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your complaints submitted vs finalized technician resolutions
                  </p>
                </div>
                <button
                  onClick={() => navigate('/student/complaints')}
                  className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="View all complaints"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="h-56 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="studentSubGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="studentResGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1e293b' }}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1630',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      name="Submitted by You"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#studentSubGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved by Staff"
                      stroke="#34d399"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#studentResGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Submitted Incidents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Completed Repairs</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Ticket Lifecycle Status Breakdown (Horizontal Progress Bars) (lg:col-span-5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dash-card dash-card-glow lg:col-span-5 p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Ticket Lifecycle
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live stages of your submitted grievances
                  </p>
                </div>
                <button
                  onClick={() => navigate('/student/complaints')}
                  className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="View history"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                  {totalCount}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Lifetime Submitted Cases
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Resolved</span>
                    </div>
                    <div className="text-white font-semibold tabular-nums">
                      {resolvedCount} tickets
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-white transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (resolvedCount / (totalCount || 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">In Progress / Assigned</span>
                    </div>
                    <div className="text-white font-semibold tabular-nums">
                      {inProgressCount} active
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, (inProgressCount / (totalCount || 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Under Triage / Review</span>
                    </div>
                    <div className="text-white font-semibold tabular-nums">
                      {underReviewCount} pending
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, (underReviewCount / (totalCount || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Complaints Table */}
          <div className="dash-card dash-card-glow p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Your Recent Complaints
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed timeline & status logs from assigned staff
                </p>
              </div>
              <Link
                to="/student/complaints"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View All Complaints</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentComplaints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                You have not submitted any complaints yet.{' '}
                <Link to="/student/submit" className="text-cyan-400 hover:underline">
                  File your first complaint
                </Link>
                .
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentComplaints.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/student/complaints/${item.id}`)}
                    className="p-5 rounded-2xl bg-[#14203e]/70 border border-white/5 hover:border-cyan-500/30 hover:bg-[#18264d] transition-all cursor-pointer space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        #{item.id.slice(0, 8)}
                      </span>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-slate-400 truncate mt-1">{item.location}</p>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-[11px] font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
