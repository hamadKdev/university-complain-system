import React from 'react';
import { PriorityLevel } from '../../types';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
}

const priorityConfig: Record<string, { label: string; textClass: string; bgClass: string; barCount: number }> = {
  low: {
    label: 'Low',
    textClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
    barCount: 1,
  },
  medium: {
    label: 'Medium',
    textClass: 'text-cyan-300',
    bgClass: 'bg-cyan-500/10 border-cyan-500/25',
    barCount: 2,
  },
  high: {
    label: 'High',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500/10 border-amber-500/25',
    barCount: 3,
  },
  urgent: {
    label: 'Urgent',
    textClass: 'text-rose-300',
    bgClass: 'bg-rose-500/10 border-rose-500/30',
    barCount: 4,
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const norm = (priority || 'medium').toLowerCase();
  const cfg = priorityConfig[norm] || {
    label: priority,
    textClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
    barCount: 1,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.bgClass} ${cfg.textClass}`}
    >
      <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`w-0.5 rounded-full transition-all ${
              bar <= cfg.barCount ? 'bg-current' : 'opacity-20 bg-current'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </span>
      <span>{cfg.label}</span>
    </span>
  );
};
