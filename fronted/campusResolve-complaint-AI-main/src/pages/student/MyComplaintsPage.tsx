import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  PlusCircle,
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Cases', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

export const MyComplaintsPage: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancel modal state
  const [cancellingComplaint, setCancellingComplaint] = useState<Complaint | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await complaintService.getComplaints(
        activeFilter === 'all' ? undefined : activeFilter
      );
      setComplaints(data);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleConfirmCancel = async () => {
    if (!cancellingComplaint) return;
    setIsCancelling(true);
    try {
      await complaintService.cancelComplaint(cancellingComplaint.id);
      success('Complaint Cancelled', `Complaint #${cancellingComplaint.id.slice(0, 8)} has been cancelled.`);
      setCancellingComplaint(null);
      loadComplaints();
    } catch (err) {
      error('Unable to Cancel Complaint', formatApiErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const totalCount = complaints.length;
  const activeCount = complaints.filter((c) => ['submitted', 'under_review', 'assigned', 'in_progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>My Campus Complaints</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-medium">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8c9fc2] mt-1">
            Track your logged grievances, real-time department updates, and resolution audit records.
          </p>
        </div>
        <Link
          to="/student/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#090e21] font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Complaint</span>
        </Link>
      </motion.div>

      {/* Mini metric pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-card dash-card-glow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#8c9fc2]">Total Filed</div>
              <div className="text-lg font-bold text-white tabular-nums">{totalCount}</div>
            </div>
          </div>
          <span className="text-[11px] text-[#617498] font-mono">All Time</span>
        </div>

        <div className="dash-card dash-card-glow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#8c9fc2]">Under Action</div>
              <div className="text-lg font-bold text-amber-300 tabular-nums">{activeCount}</div>
            </div>
          </div>
          <span className="text-[11px] text-amber-400/80 font-mono">In Progress</span>
        </div>

        <div className="dash-card dash-card-glow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#8c9fc2]">Successfully Solved</div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">{resolvedCount}</div>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">Resolved</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dash-card dash-card-glow p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#617498] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grievances by title, category, location, or ticket ID..."
            className="w-full bg-[#0a1024]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#617498] focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8c9fc2] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[#8c9fc2] mr-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filter:</span>
          </span>
          {STATUS_FILTERS.map((f) => {
            const active = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/10'
                    : 'text-[#8c9fc2] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="dash-card dash-card-glow p-5 sm:p-6">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadComplaints} />}

        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title="No complaints found"
            description={
              searchQuery
                ? 'Try adjusting your search criteria or resetting the status filter.'
                : 'You have no complaints logged under this status category.'
            }
            action={
              searchQuery || activeFilter !== 'all'
                ? {
                    label: 'Reset Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    },
                  }
                : {
                    label: 'File a Complaint',
                    onClick: () => (window.location.href = '/student/submit'),
                  }
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold text-[#8c9fc2] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket ID & Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#c4d1e6]">
                {filteredComplaints.map((item) => {
                  const isCancellable =
                    item.status === 'submitted' || item.status === 'under_review';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/student/complaints/${item.id}`}
                          className="font-semibold text-white group-hover:text-cyan-300 transition-colors block max-w-sm truncate"
                        >
                          {item.title}
                        </Link>
                        <div className="text-[11px] text-[#617498] font-mono mt-0.5">
                          #{item.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#182444] border border-white/5 text-[#8c9fc2] text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8c9fc2] max-w-xs truncate">{item.location}</td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-[#8c9fc2] tabular-nums whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            to={`/student/complaints/${item.id}`}
                            className="p-1.5 rounded-lg bg-[#182444] hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-colors border border-white/5 hover:border-cyan-500/30"
                            title="View full details and updates"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {isCancellable && (
                            <button
                              onClick={() => setCancellingComplaint(item)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20"
                              title="Cancel this eligible complaint"
                              aria-label="Cancel complaint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancellingComplaint}
        title="Cancel Campus Complaint?"
        message={`Are you sure you want to cancel "${cancellingComplaint?.title}"? This cancels eligible complaints without deleting audit records.`}
        confirmLabel="Cancel Complaint"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingComplaint(null)}
      />
    </div>
  );
};
