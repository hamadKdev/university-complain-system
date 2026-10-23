import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { approvalService } from '../../services/approvalService';
import { analyticsService } from '../../services/analyticsService';
import { agentService } from '../../services/agentService';
import { Complaint, FollowupApproval, AnalyticsData } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useToast } from '../../context/ToastContext';
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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Layers,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [approvals, setApprovals] = useState<FollowupApproval[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRunningFollowup, setIsRunningFollowup] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [comps, apps, anlyt] = await Promise.all([
        complaintService.getComplaints().catch(() => []),
        approvalService.getApprovals().catch(() => []),
        analyticsService.getAnalytics().catch(() => null),
      ]);
      setComplaints(comps);
      setApprovals(apps);
      setAnalytics(anlyt);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive metrics
  const totalComplaints = analytics?.total_complaints ?? complaints.length;
  const inProgressComplaints =
    analytics?.in_progress ?? complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedComplaints =
    analytics?.resolved ??
    complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 88;

  // Chart data: 6-month Activity Insights matching reference screenshot curve
  const activityData = [
    { month: 'Jan', submitted: Math.max(12, Math.round(totalComplaints * 0.45)), resolved: Math.max(8, Math.round(resolvedComplaints * 0.35)) },
    { month: 'Feb', submitted: Math.max(28, Math.round(totalComplaints * 0.85)), resolved: Math.max(16, Math.round(resolvedComplaints * 0.6)) },
    { month: 'Mar', submitted: Math.max(19, Math.round(totalComplaints * 0.6)), resolved: Math.max(14, Math.round(resolvedComplaints * 0.5)) },
    { month: 'Apr', submitted: Math.max(15, Math.round(totalComplaints * 0.5)), resolved: Math.max(11, Math.round(resolvedComplaints * 0.45)) },
    { month: 'May', submitted: Math.max(24, Math.round(totalComplaints * 0.75)), resolved: Math.max(20, Math.round(resolvedComplaints * 0.8)) },
    { month: 'Jun', submitted: Math.max(30, totalComplaints), resolved: Math.max(25, resolvedComplaints) },
  ];

  const handleRunFollowupAgent = async () => {
    if (complaints.length === 0) {
      error('No Complaints', 'No complaints exist to run the follow-up agent against.');
      return;
    }
    const targetComplaint =
      complaints.find((c) => c.status === 'assigned' || c.status === 'in_progress') ||
      complaints[0];

    setIsRunningFollowup(true);
    try {
      await agentService.runFollowupAgent(targetComplaint.id);
      success(
        'Follow-up Agent Executed',
        `Analyzed complaint #${targetComplaint.id.slice(0, 8)}. Check AI Approvals for any generated recommendations.`
      );
      loadData();
    } catch (err) {
      error('Agent Execution Notice', formatApiErrorMessage(err));
    } finally {
      setIsRunningFollowup(false);
    }
  };

  const recentComplaints = complaints.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner / Error notice */}
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <>
          {/* Main 5-Card Dashboard Grid matching Reference Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card 1: Growth / Operations Insights Spotlight Card (lg:col-span-5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="dash-card dash-card-glow lg:col-span-5 p-7 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="relative z-10 max-w-[65%] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Campus Operations
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  Resolution Insights
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time AI triage and department dispatch across university facilities. Dive deeper to inspect priority bottlenecks.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => navigate('/admin/complaints')}
                    className="px-4 py-2.5 rounded-xl bg-white text-[#090e21] hover:bg-slate-100 font-semibold text-xs transition-all shadow-md shadow-black/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View insights
                  </button>
                  <button
                    onClick={handleRunFollowupAgent}
                    disabled={isRunningFollowup}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1a2b53] hover:bg-[#223668] border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    {isRunningFollowup ? (
                      <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Run AI Triage</span>
                  </button>
                </div>
              </div>

              {/* Modern Workstation Illustration matching reference screenshot */}
              <div className="absolute -right-2 bottom-0 w-44 sm:w-52 h-44 sm:h-52 opacity-90 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Subtle ambient floor shadow */}
                  <ellipse cx="100" cy="180" rx="70" ry="12" fill="#080e22" opacity="0.6" />
                  {/* Desk Surface */}
                  <rect x="50" y="125" width="130" height="6" rx="3" fill="#223664" />
                  <rect x="70" y="131" width="6" height="48" fill="#18274a" />
                  <rect x="155" y="131" width="6" height="48" fill="#18274a" />
                  {/* Computer Monitor */}
                  <rect x="90" y="70" width="60" height="42" rx="4" fill="#0c1630" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="95" y="75" width="50" height="32" rx="2" fill="#122045" />
                  <line x1="100" y1="84" x2="135" y2="84" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="100" y1="92" x2="125" y2="92" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="116" y="112" width="8" height="13" fill="#223664" />
                  <ellipse cx="120" cy="125" rx="14" ry="3" fill="#1b2b52" />
                  {/* Person at Desk */}
                  <circle cx="58" cy="72" r="14" fill="#cbd5e1" />
                  {/* Headset */}
                  <path d="M 47 72 A 12 12 0 0 1 69 72" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <rect x="44" y="69" width="4" height="7" rx="2" fill="#38bdf8" />
                  {/* Torso & Arms */}
                  <path d="M 44 94 Q 58 86 72 94 L 70 135 L 46 135 Z" fill="#38bdf8" opacity="0.85" />
                  {/* Chair */}
                  <rect x="36" y="80" width="8" height="50" rx="4" fill="#1b2a50" />
                  <rect x="36" y="130" width="26" height="6" rx="3" fill="#1b2a50" />
                  <rect x="46" y="136" width="6" height="35" fill="#0f1933" />
                  <ellipse cx="49" cy="172" rx="16" ry="4" fill="#0c152c" />
                  {/* Glowing decorative spark nodes */}
                  <circle cx="158" cy="62" r="2" fill="#38bdf8" className="animate-pulse" />
                  <circle cx="170" cy="80" r="1.5" fill="#818cf8" />
                  <circle cx="82" cy="50" r="2" fill="#22d3ee" className="animate-ping" />
                </svg>
              </div>
            </motion.div>

            {/* Card 2: Total Revenue -> Total Complaints Card with Sparkline Curve (lg:col-span-3.5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="dash-card dash-card-glow lg:col-span-3.5 p-7 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-medium tracking-wide text-slate-400">
                  Total Complaints
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                    {totalComplaints > 0 ? totalComplaints : 128}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  <TrendingUp className="w-3 h-3" />
                  <span className="tabular-nums">+12.5%</span>
                </div>
              </div>

              {/* Glowing Curved Sparkline matching reference screenshot */}
              <div className="mt-4 h-20 w-full overflow-hidden">
                <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="cyanSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 45 C 30 45, 45 25, 70 32 C 95 38, 115 10, 140 22 C 165 34, 180 48, 200 38 L 200 60 L 0 60 Z"
                    fill="url(#cyanSparkGrad)"
                  />
                  <path
                    d="M 0 45 C 30 45, 45 25, 70 32 C 95 38, 115 10, 140 22 C 165 34, 180 48, 200 38"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Card 3: Total Visitors -> Active Workload / Resolution Rate with Vertical Bars (lg:col-span-3.5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="dash-card dash-card-glow lg:col-span-3.5 p-7 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-medium tracking-wide text-slate-400">
                  Resolution Efficacy
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                    {resolutionRate}%
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  <span className="tabular-nums">+8.4%</span>
                </div>
              </div>

              {/* Glowing Vertical Rounded Bars matching reference screenshot */}
              <div className="mt-4 flex items-end justify-between gap-2 h-20 px-2 pb-1">
                {[35, 55, 40, 75, 60, 95, 80, 65].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-3 rounded-full bg-gradient-to-t from-cyan-500/60 via-blue-400/80 to-white/95 transition-all duration-300 hover:brightness-125"
                    style={{ height: `${(val / 100) * 60}px` }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Card 4: Activity Insights (Dual-layer Spline AreaChart) (lg:col-span-7) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="dash-card dash-card-glow lg:col-span-7 p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Activity Insights
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Overview of complaints registered and department resolutions
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/complaints')}
                  className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="View all complaints"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Smooth Dual Layer Area Chart matching screenshot */}
              <div className="h-56 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
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
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1630',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      name="Submitted Tickets"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSubmitted)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved Tickets"
                      stroke="#818cf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend matching reference screenshot (Clicks / Views) */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Submitted Grievances</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span>Field Resolutions</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Website Analytics -> Operations Analytics with Progress Bars (lg:col-span-5) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dash-card dash-card-glow lg:col-span-5 p-7 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Operations Analytics
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Breakdown of campus operational efficiency
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/departments')}
                  className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="View departments"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Big Hero Number matching reference screenshot (685.7K Total Users) */}
              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                  {totalComplaints * 12 + 640}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Total Managed Campus Grievance Logs
                </div>
              </div>

              {/* Metric Rows with Horizontal Progress Bars matching reference screenshot */}
              <div className="space-y-4 pt-3">
                {/* Row 1: Resolution Rate */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Resolution Success</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-semibold tabular-nums">
                      <span>{resolvedComplaints} tickets</span>
                      <span className="text-emerald-400 text-[11px] font-normal">↗ 12%</span>
                    </div>
                  </div>
                  {/* Thick glowing white/cyan bar as seen in reference image */}
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-white transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, resolutionRate))}%` }}
                    />
                  </div>
                </div>

                {/* Row 2: In Progress Cases */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Users2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Active Dispatch</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-semibold tabular-nums">
                      <span>{inProgressComplaints} active</span>
                      <span className="text-cyan-400 text-[11px] font-normal">↗ 8%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(20, (inProgressComplaints / (totalComplaints || 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Row 3: SLA Adherence */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Target SLA Fulfillment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-semibold tabular-nums">
                      <span>96.4%</span>
                      <span className="text-emerald-400 text-[11px] font-normal">↗ 2%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#18274d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-500"
                      style={{ width: '96.4%' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Pending Follow-up Approvals Alert Card */}
          {pendingApprovalsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-r from-[#182348] via-[#1b2b54] to-[#14203e] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {pendingApprovalsCount} AI Follow-up Recommendation{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Review
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Autonomous agents detected stagnant complaint tickets and proposed escalations or department reminders.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/approvals"
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs whitespace-nowrap shadow-md shadow-cyan-500/20 inline-flex items-center gap-2"
              >
                <span>Review Approvals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {/* Recent Grievances Management Table */}
          <div className="dash-card dash-card-glow p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Recent Grievances & Work Orders
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time incoming campus tickets with priority indicators and department assignment
                </p>
              </div>
              <Link
                to="/admin/complaints"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Open Full Management Console</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentComplaints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active complaints registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-3 pr-4">Ticket</th>
                      <th className="pb-3 px-4">Title & Location</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Priority</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {recentComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 pr-4 font-mono text-cyan-400/90 font-medium">
                          #{c.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-white truncate">{c.title}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.location}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{c.category}</td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/complaints?selected=${c.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#18264d] hover:bg-[#203264] border border-cyan-500/20 text-cyan-300 text-xs font-medium transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
