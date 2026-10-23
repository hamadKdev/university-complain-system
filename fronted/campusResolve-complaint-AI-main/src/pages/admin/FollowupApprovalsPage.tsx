import React, { useEffect, useState, useCallback } from 'react';
import { approvalService, CreateApprovalPayload } from '../../services/approvalService';
import { complaintService } from '../../services/complaintService';
import { agentService } from '../../services/agentService';
import { FollowupApproval, Complaint, RecommendedAction, ApprovalStatus } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Eye,
  PlusCircle,
  FileText,
  AlertCircle,
  Send,
  X,
  Bot,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FollowupApprovalsPage: React.FC = () => {
  const { success, error } = useToast();

  const [approvals, setApprovals] = useState<FollowupApproval[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');

  // Review confirmation modal
  const [reviewingApproval, setReviewingApproval] = useState<FollowupApproval | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Detail panel modal
  const [activeApproval, setActiveApproval] = useState<FollowupApproval | null>(null);

  // Manual Create Approval Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction>('remind');
  const [reason, setReason] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Agent execution
  const [isRunningAgent, setIsRunningAgent] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [apps, comps] = await Promise.all([
        approvalService.getApprovals(),
        complaintService.getComplaints().catch(() => []),
      ]);
      setApprovals(apps);
      setComplaints(comps);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenReview = (item: FollowupApproval, dec: 'approved' | 'rejected') => {
    setReviewingApproval(item);
    setDecision(dec);
  };

  const handleConfirmDecision = async () => {
    if (!reviewingApproval) return;
    setIsSubmittingDecision(true);
    try {
      await approvalService.reviewApproval(reviewingApproval.id, decision);
      success(
        `Approval ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        `Recommendation for complaint #${reviewingApproval.complaint_id.slice(0, 8)} has been marked as ${decision}.`
      );
      setReviewingApproval(null);
      loadData();
    } catch (err) {
      error('Decision Submission Failed', formatApiErrorMessage(err));
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleCreateApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) {
      error('Complaint Required', 'Please select a complaint to attach the recommendation to.');
      return;
    }
    if (!reason.trim()) {
      error('Reason Required', 'Please explain the justification for this action.');
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateApprovalPayload = {
        complaint_id: selectedComplaintId,
        recommended_action: recommendedAction,
        reason: reason.trim(),
      };
      await approvalService.createApproval(payload);
      success('Approval Created', 'Manual follow-up request queued for human review.');
      setIsCreateModalOpen(false);
      setSelectedComplaintId('');
      setReason('');
      loadData();
    } catch (err) {
      error('Creation Failed', formatApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleTriggerAgent = async () => {
    if (complaints.length === 0) {
      error('No Complaints', 'No tickets available to run follow-up scans.');
      return;
    }
    const target = complaints.find(
      (c) => c.status === 'assigned' || c.status === 'in_progress'
    ) || complaints[0];

    setIsRunningAgent(true);
    try {
      await agentService.runFollowupAgent(target.id);
      success(
        'Agent Probed Unresolved Case',
        `Analyzed ticket #${target.id.slice(0, 8)}. Evaluated resolution bottlenecks.`
      );
      loadData();
    } catch (err) {
      error('Follow-up Agent Failed', formatApiErrorMessage(err));
    } finally {
      setIsRunningAgent(false);
    }
  };

  const getAssociatedComplaint = (cid: string): Complaint | undefined => {
    return complaints.find((c) => c.id === cid);
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;

  const filteredApprovals = approvals.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Autonomous Agent Governance
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            AI Follow-Up Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Human-in-the-loop verification for autonomous follow-up agent recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#14203e] hover:bg-[#1b2b54] text-slate-200 border border-white/10 text-xs font-semibold transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Create Recommendation</span>
          </button>
          <button
            onClick={handleTriggerAgent}
            disabled={isRunningAgent}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] text-xs font-semibold transition-colors shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isRunningAgent ? (
              <span className="w-4 h-4 border-2 border-[#090e21] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Trigger AI Scan</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Pending Review</span>
            <div className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{pendingCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting human authorization</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Approved Reminders</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1 tabular-nums">{approvedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to technician queues</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Dismissed / Rejected</span>
            <div className="text-2xl font-bold text-rose-300 mt-1 tabular-nums">{rejectedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Filtered by administrator</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0c142b] border border-white/5 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === tab
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="dash-card dash-card-glow p-6">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : filteredApprovals.length === 0 ? (
          <EmptyState
            title="No approval records"
            description="No AI recommendations match this filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Case / Recommendation</th>
                  <th className="pb-3 px-4">Action</th>
                  <th className="pb-3 px-4">AI Reason & Context</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Generated</th>
                  <th className="pb-3 pl-4 text-right">Review Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredApprovals.map((item) => {
                  const comp = getAssociatedComplaint(item.complaint_id);
                  const isPending = item.status === 'pending';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-medium text-cyan-400">
                        #{item.id.slice(0, 8)}
                        <div className="text-[11px] font-sans text-white font-semibold truncate max-w-xs mt-0.5">
                          {comp ? comp.title : `Ticket: ${item.complaint_id.slice(0, 8)}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            item.recommended_action === 'escalate'
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                              : item.recommended_action === 'remind'
                              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                              : 'bg-slate-500/10 border-slate-500/20 text-slate-300'
                          }`}
                        >
                          {item.recommended_action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {item.reason}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full border ${
                            item.status === 'approved'
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'approved'
                                ? 'bg-emerald-400'
                                : item.status === 'rejected'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setActiveApproval(item)}
                            className="p-1.5 rounded-lg bg-[#14203e] hover:bg-[#1b2b52] text-slate-300 hover:text-white transition-colors border border-white/5"
                            title="Inspect complete recommendation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenReview(item, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-colors border border-rose-500/20"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleOpenReview(item, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition-colors border border-emerald-500/20"
                              >
                                Approve
                              </button>
                            </>
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

      {/* Manual Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="dash-card dash-card-glow max-w-lg w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white">Create Follow-up Recommendation</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateApprovalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Complaint
                  </label>
                  <select
                    value={selectedComplaintId}
                    onChange={(e) => setSelectedComplaintId(e.target.value)}
                    required
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  >
                    <option value="" disabled>Select complaint ticket</option>
                    {complaints.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0b1328]">
                        #{c.id.slice(0, 8)} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Recommended Action
                  </label>
                  <select
                    value={recommendedAction}
                    onChange={(e) => setRecommendedAction(e.target.value as RecommendedAction)}
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  >
                    <option value="remind" className="bg-[#0b1328]">Remind (Ping technician for status)</option>
                    <option value="escalate" className="bg-[#0b1328]">Escalate (Raise urgency priority)</option>
                    <option value="none" className="bg-[#0b1328]">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Reasoning & Audited Context
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Provide justification for this follow-up action..."
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
                  >
                    {isCreating ? 'Submitting...' : 'Queue Recommendation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decision Confirmation Modal */}
      <ConfirmModal
        isOpen={!!reviewingApproval}
        title={decision === 'approved' ? 'Approve AI Recommendation' : 'Reject AI Recommendation'}
        message={`Are you sure you want to mark this recommendation as ${decision}? Action: "${reviewingApproval?.recommended_action}". Reason: "${reviewingApproval?.reason}"`}
        confirmLabel={isSubmittingDecision ? 'Submitting...' : `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`}
        isDestructive={decision === 'rejected'}
        onConfirm={handleConfirmDecision}
        onCancel={() => setReviewingApproval(null)}
      />

      {/* Inspect Detail Modal */}
      <AnimatePresence>
        {activeApproval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="dash-card dash-card-glow max-w-lg w-full p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white">#{activeApproval.id.slice(0, 8)}</span>
                </div>
                <button onClick={() => setActiveApproval(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Proposed Action</span>
                  <span className="font-bold uppercase text-cyan-300">{activeApproval.recommended_action}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold capitalize text-white">{activeApproval.status}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0c142b] border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Reasoning</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{activeApproval.reason}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end">
                <button
                  onClick={() => setActiveApproval(null)}
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
