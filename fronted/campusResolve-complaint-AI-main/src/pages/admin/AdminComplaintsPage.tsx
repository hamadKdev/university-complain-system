import React, { useEffect, useState, useCallback } from 'react';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { assignmentService } from '../../services/assignmentService';
import { agentService } from '../../services/agentService';
import { Complaint, Department, UserProfile } from '../../types';
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
  UserCheck,
  Sparkles,
  Eye,
  Trash2,
  X,
  Building2,
  Cpu,
  History,
  Send,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminComplaintsPage: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Assignment Modal State
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Cancellation Modal State
  const [cancellingComplaint, setCancellingComplaint] = useState<Complaint | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // AI Agent Running state
  const [runningAgentCid, setRunningAgentCid] = useState<string | null>(null);

  // Detail Drawer State
  const [inspectingComplaint, setInspectingComplaint] = useState<Complaint | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [comps, depts, usrs] = await Promise.all([
        complaintService.getComplaints(statusFilter === 'all' ? undefined : statusFilter),
        departmentService.getDepartments().catch(() => []),
        userService.getUsers().catch(() => []),
      ]);
      setComplaints(comps);
      setDepartments(depts);
      setUsers(usrs);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = (item: Complaint) => {
    setAssigningComplaint(item);
    setSelectedDeptId(item.department_id || (departments[0]?.id ?? ''));
    setSelectedStaffId(item.assigned_to || '');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;

    if (!selectedDeptId || !selectedStaffId) {
      error('Selection Required', 'Please choose both a target department and an assigned staff member.');
      return;
    }

    setIsAssigning(true);
    try {
      await assignmentService.assignComplaint({
        complaint_id: assigningComplaint.id,
        department_id: selectedDeptId,
        staff_id: selectedStaffId,
      });

      success(
        'Assignment Dispatched',
        `Complaint #${assigningComplaint.id.slice(0, 8)} successfully assigned.`
      );
      setAssigningComplaint(null);
      loadData();
    } catch (err) {
      error('Assignment Failed', formatApiErrorMessage(err));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRunTriage = async (cid: string) => {
    setRunningAgentCid(cid);
    try {
      const res = await agentService.runTriage(cid);
      success(
        'AI Triage Completed',
        `Confidence: ${Math.round((res.confidence || 0.9) * 100)}%. Suggested: ${res.category || 'Categorized'}.`
      );
      loadData();
    } catch (err) {
      error('Triage Execution Failed', formatApiErrorMessage(err));
    } finally {
      setRunningAgentCid(null);
    }
  };

  const handleRunAssignmentAgent = async (cid: string) => {
    setRunningAgentCid(cid);
    try {
      const res = await agentService.runAssignmentAgent(cid);
      success(
        'Autonomous Routing Finished',
        `Agent evaluated incident and recommended assignment: ${res.recommended_staff_name || 'Staff'}`
      );
      loadData();
    } catch (err) {
      error('Assignment Agent Failed', formatApiErrorMessage(err));
    } finally {
      setRunningAgentCid(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancellingComplaint) return;
    setIsCancelling(true);
    try {
      await complaintService.cancelComplaint(cancellingComplaint.id);
      success('Complaint Cancelled', `Case #${cancellingComplaint.id.slice(0, 8)} has been cancelled.`);
      setCancellingComplaint(null);
      loadData();
    } catch (err) {
      error('Cancellation Failed', formatApiErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.department_name && c.department_name.toLowerCase().includes(q))
    );
  });

  const availableStaff = users.filter(
    (u) => u.role === 'staff' && (!selectedDeptId || u.department_id === selectedDeptId)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Operations Management
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Grievances & Dispatch Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter, inspect autonomous AI triage, and route student grievances to department field staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 rounded-xl">
            {filteredComplaints.length} Total Cases
          </span>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="dash-card dash-card-glow p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title, location, ID, or category..."
            className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all shadow-inner"
          />
        </div>

        {/* Status Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { label: 'All Cases', value: 'all' },
            { label: 'Submitted', value: 'submitted' },
            { label: 'Under Review', value: 'under_review' },
            { label: 'Assigned', value: 'assigned' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.value
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
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

        {isLoading ? (
          <LoadingSkeleton rows={7} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title="No grievances found"
            description="No tickets match the active search query or status criteria."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setSearchQuery('');
                setStatusFilter('all');
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Ticket</th>
                  <th className="pb-3 px-4">Title & Location</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Priority</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Assigned Department / Staff</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredComplaints.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 pr-4 font-mono font-medium text-cyan-400">
                      #{item.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.location}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.department_name ? (
                        <div className="font-medium text-white">{item.department_name}</div>
                      ) : (
                        <span className="text-amber-400 italic">Unassigned</span>
                      )}
                      {item.assigned_staff_name && (
                        <div className="text-[10px] text-slate-400">Tech: {item.assigned_staff_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setInspectingComplaint(item)}
                          className="p-1.5 rounded-lg bg-[#14203e] hover:bg-[#1b2b52] text-slate-300 hover:text-white transition-colors border border-white/5"
                          title="Inspect case details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRunTriage(item.id)}
                          disabled={runningAgentCid === item.id}
                          className="p-1.5 rounded-lg bg-[#14203e] hover:bg-[#1b2b52] text-cyan-300 hover:text-cyan-200 transition-colors border border-cyan-500/20 disabled:opacity-50"
                          title="Trigger AI Triage Analysis"
                        >
                          {runningAgentCid === item.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenAssign(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#18264d] hover:bg-[#203264] border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Assign</span>
                        </button>

                        {item.status !== 'cancelled' && item.status !== 'resolved' && (
                          <button
                            onClick={() => setCancellingComplaint(item)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors border border-rose-500/20"
                            title="Cancel grievance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {assigningComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="dash-card dash-card-glow max-w-lg w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Assign Complaint Dispatch</h3>
                    <p className="text-[11px] text-slate-400 font-mono">#{assigningComplaint.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssigningComplaint(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c142b] border border-white/5 space-y-1">
                <p className="text-xs font-semibold text-white truncate">{assigningComplaint.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{assigningComplaint.location}</p>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedStaffId('');
                    }}
                    required
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  >
                    <option value="" disabled>Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#0b1328]">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Assigned Technician / Staff
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  >
                    <option value="" disabled>Select department staff member</option>
                    {availableStaff.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0b1328]">
                        {s.full_name} ({s.email})
                      </option>
                    ))}
                  </select>
                  {availableStaff.length === 0 && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      No staff members assigned to this department yet. You can assign staff in User Directory.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setAssigningComplaint(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || availableStaff.length === 0}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isAssigning ? 'Dispatching...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Slide-over Drawer */}
      <AnimatePresence>
        {inspectingComplaint && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-[#0c142b] border-l border-white/10 h-full overflow-y-auto p-6 sm:p-7 space-y-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-semibold">
                    <span>CASE TICKET #{inspectingComplaint.id.slice(0, 8)}</span>
                  </div>
                  <button
                    onClick={() => setInspectingComplaint(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inspectingComplaint.status} />
                    <PriorityBadge priority={inspectingComplaint.priority} />
                  </div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {inspectingComplaint.title}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#121d3a] p-3.5 rounded-xl border border-white/5 whitespace-pre-wrap">
                    {inspectingComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#121d3a] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Location</span>
                    <p className="text-white font-medium mt-1 truncate">{inspectingComplaint.location}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121d3a] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category</span>
                    <p className="text-white font-medium mt-1 truncate">{inspectingComplaint.category}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121d3a] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assigned Dept</span>
                    <p className="text-cyan-300 font-medium mt-1 truncate">
                      {inspectingComplaint.department_name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121d3a] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Submitted On</span>
                    <p className="text-white font-medium mt-1 tabular-nums">
                      {new Date(inspectingComplaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {inspectingComplaint.triage && (
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Autonomous AI Triage Assessment</span>
                    </div>
                    {inspectingComplaint.triage.summary && (
                      <p className="text-xs text-slate-300">{inspectingComplaint.triage.summary}</p>
                    )}
                    {inspectingComplaint.triage.urgency_reason && (
                      <p className="text-[11px] text-cyan-200/80 italic">
                        “{inspectingComplaint.triage.urgency_reason}”
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    const c = inspectingComplaint;
                    setInspectingComplaint(null);
                    handleOpenAssign(c);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-md"
                >
                  Dispatch to Staff Member
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Modal */}
      <ConfirmModal
        isOpen={!!cancellingComplaint}
        title="Cancel Grievance Case"
        message={`Are you sure you want to cancel complaint #${cancellingComplaint?.id.slice(0, 8)}? This action marks the grievance as cancelled.`}
        confirmLabel={isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
        isDestructive
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancellingComplaint(null)}
      />
    </div>
  );
};
