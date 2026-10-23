import React, { useEffect, useState, useCallback } from 'react';
import { complaintService } from '../../services/complaintService';
import { Complaint, ComplaintStatus, PriorityLevel } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  X,
  History,
  CheckSquare,
  Wrench,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Cases', value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Under Review', value: 'under_review' },
];

export const StaffQueuePage: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status & Progress Update Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [progressNote, setProgressNote] = useState<string>('');
  const [resolutionDetails, setResolutionDetails] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Updates history modal
  const [historyComplaint, setHistoryComplaint] = useState<Complaint | null>(null);
  const [historyUpdates, setHistoryUpdates] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  const handleOpenUpdate = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setProgressNote('');
    setResolutionDetails('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdating(true);
    try {
      const combinedMessage = [
        progressNote.trim() ? `Progress Note: ${progressNote.trim()}` : '',
        resolutionDetails.trim() ? `Resolution Details: ${resolutionDetails.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      await complaintService.updateStatus(selectedComplaint.id, {
        status: newStatus,
        message: combinedMessage || `Status changed to ${newStatus}`,
      });

      if (combinedMessage) {
        await complaintService.addUpdate(selectedComplaint.id, {
          status: newStatus,
          message: combinedMessage,
        }).catch(() => {});
      }

      success(
        'Work Status Updated',
        `Case #${selectedComplaint.id.slice(0, 8)} set to "${newStatus.replace(/_/g, ' ')}".`
      );
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err) {
      error('Update Failed', formatApiErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenHistory = async (complaint: Complaint) => {
    setHistoryComplaint(complaint);
    setIsLoadingHistory(true);
    try {
      const updates = await complaintService.getUpdates(complaint.id);
      setHistoryUpdates(updates);
    } catch (err) {
      error('Failed to load logs', formatApiErrorMessage(err));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Field Technician Workspace
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Department Work Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute repairs, record official progress notes, and publish confirmed resolution details.
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 rounded-xl">
          {filteredComplaints.length} Assigned Cases
        </div>
      </div>

      {/* Search and Filters */}
      <div className="dash-card dash-card-glow p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work queue by title, location, or ticket ID..."
            className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400/60 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {STATUS_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === f.value
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dash-card dash-card-glow p-6">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadComplaints} />}

        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title="Work Queue Clear"
            description="No assigned complaints require diagnostic updates under this status."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setActiveFilter('all');
                setSearchQuery('');
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Ticket</th>
                  <th className="pb-3 px-4">Title & Description</th>
                  <th className="pb-3 px-4">Location</th>
                  <th className="pb-3 px-4">Priority</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Reported</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredComplaints.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-medium text-cyan-400">
                      #{item.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{item.location}</td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="p-1.5 rounded-lg bg-[#14203e] hover:bg-[#1b2b52] text-slate-300 hover:text-white transition-colors border border-white/5"
                          title="View resolution history"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenUpdate(item)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-sm inline-flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="dash-card dash-card-glow max-w-lg w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Log Work & Status Progression</h3>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c142b] border border-white/5 space-y-1">
                <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                  #{selectedComplaint.id.slice(0, 8)}
                </span>
                <p className="text-xs font-semibold text-white truncate">{selectedComplaint.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{selectedComplaint.location}</p>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Update Workflow Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all font-semibold"
                  >
                    <option value="in_progress" className="bg-[#0b1328]">In Progress (Active Field Work)</option>
                    <option value="resolved" className="bg-[#0b1328]">Resolved (Completed / Repaired)</option>
                    <option value="assigned" className="bg-[#0b1328]">Assigned (Under Assessment)</option>
                    <option value="under_review" className="bg-[#0b1328]">Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Progress Note
                  </label>
                  <textarea
                    rows={2}
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="E.g., Replacement parts ordered, scheduled testing for tomorrow morning..."
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Resolution Details (If completing ticket)
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="E.g., Circuit breaker replaced and electrical panel certified nominal..."
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Publish Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Slide-over Modal */}
      <AnimatePresence>
        {historyComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="dash-card dash-card-glow max-w-lg w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Work Progress History</h3>
                </div>
                <button onClick={() => setHistoryComplaint(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#0c142b] border border-white/5 space-y-1">
                <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                  #{historyComplaint.id.slice(0, 8)}
                </span>
                <p className="text-xs font-semibold text-white truncate">{historyComplaint.title}</p>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading progress logs...</div>
              ) : historyUpdates.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No progress logs recorded yet.</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {historyUpdates.map((u, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#0c142b] border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-cyan-300">{u.author_name || 'Staff Technician'}</span>
                        <span className="tabular-nums">{new Date(u.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-white whitespace-pre-wrap leading-relaxed">{u.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                <button
                  onClick={() => setHistoryComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
