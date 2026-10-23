import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  accentColor?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose';
  chartType?: 'line' | 'bars' | 'none';
  sparklineData?: number[];
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  trendUp = true,
  accentColor = 'cyan',
  chartType = 'none',
  sparklineData,
  onClick,
}) => {
  // Generate SVG path for line sparkline
  const linePoints = sparklineData || [30, 45, 38, 62, 50, 75, 68, 85, 78, 92];
  const max = Math.max(...linePoints);
  const min = Math.min(...linePoints);
  const range = max - min || 1;
  const width = 140;
  const height = 48;

  const pointsString = linePoints
    .map((val, idx) => {
      const x = (idx / (linePoints.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  // Smooth SVG path curve
  const pathD = linePoints.reduce((acc, val, idx) => {
    const x = (idx / (linePoints.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    if (idx === 0) return `M ${x} ${y}`;
    const prevX = ((idx - 1) / (linePoints.length - 1)) * width;
    const prevY = height - ((linePoints[idx - 1] - min) / range) * (height - 8) - 4;
    const cX = (prevX + x) / 2;
    return `${acc} C ${cX} ${prevY}, ${cX} ${y}, ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const barData = sparklineData || [35, 60, 45, 80, 55, 95, 70];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={onClick ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`dash-card dash-card-glow p-6 flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Header: Label & Trend */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium tracking-wide text-slate-400">
            {label}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#1b2b52]/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Middle/Bottom: Trend Badge & Sparkline / Graph */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          {trend && (
            <div
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                trendUp
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="tabular-nums">{trend}</span>
            </div>
          )}

          {subtext && (
            <p className="mt-1 text-[11px] text-slate-400 truncate max-w-[180px]">
              {subtext}
            </p>
          )}
        </div>

        {/* Embedded Reference-Style Sparklines */}
        {chartType === 'line' && (
          <div className="w-32 h-12 overflow-hidden shrink-0">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={areaD}
                fill={`url(#grad-${label.replace(/\s+/g, '')})`}
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {chartType === 'bars' && (
          <div className="flex items-end gap-1.5 h-10 shrink-0 pb-1">
            {barData.map((val, i) => (
              <div
                key={i}
                className="w-2.5 rounded-full bg-gradient-to-t from-cyan-500/60 to-white/90 transition-all duration-300 hover:brightness-125"
                style={{ height: `${Math.max(15, (val / 100) * 36)}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
