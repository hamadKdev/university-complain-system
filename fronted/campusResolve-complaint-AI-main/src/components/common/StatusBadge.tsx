import React from 'react';
import { ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  submitted: {
    label: 'Submitted',
    textClass: 'text-cyan-300',
    bgClass: 'bg-cyan-500/10 border-cyan-500/25',
    dotClass: 'bg-cyan-400',
  },
  under_review: {
    label: 'Under Review',
    textClass: 'text-blue-300',
    bgClass: 'bg-blue-500/10 border-blue-500/25',
    dotClass: 'bg-blue-400',
  },
  assigned: {
    label: 'Assigned',
    textClass: 'text-indigo-300',
    bgClass: 'bg-indigo-500/10 border-indigo-500/25',
    dotClass: 'bg-indigo-400',
  },
  in_progress: {
    label: 'In Progress',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500/10 border-amber-500/25',
    dotClass: 'bg-amber-400',
  },
  resolved: {
    label: 'Resolved',
    textClass: 'text-emerald-300',
    bgClass: 'bg-emerald-500/10 border-emerald-500/25',
    dotClass: 'bg-emerald-400',
  },
  closed: {
    label: 'Closed',
    textClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
    dotClass: 'bg-slate-400',
  },
  reopened: {
    label: 'Reopened',
    textClass: 'text-orange-300',
    bgClass: 'bg-orange-500/10 border-orange-500/25',
    dotClass: 'bg-orange-400',
  },
  rejected: {
    label: 'Rejected',
    textClass: 'text-rose-300',
    bgClass: 'bg-rose-500/10 border-rose-500/25',
    dotClass: 'bg-rose-400',
  },
  cancelled: {
    label: 'Cancelled',
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-700/20 border-slate-700/40',
    dotClass: 'bg-slate-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const cfg = statusConfig[normKey] || {
    label: (status || 'Unknown').replace(/_/g, ' '),
    textClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
    dotClass: 'bg-slate-400',
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full backdrop-blur-xs ${
        isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${cfg.bgClass} ${cfg.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
};
