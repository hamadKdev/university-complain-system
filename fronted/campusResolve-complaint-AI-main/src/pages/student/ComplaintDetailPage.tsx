import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { complaintService, EditComplaintPayload } from '../../services/complaintService';
import { Complaint, ComplaintUpdate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Building2,
  User,
  Sparkles,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  History,
  X,
  FileText,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [compData, updatesData] = await Promise.all([
        complaintService.getComplaint(id),
        complaintService.getUpdates(id).catch(() => []),
      ]);
      setComplaint(compData);
      setUpdates(updatesData);
      setEditTitle(compData.title);
      setEditCategory(compData.category);
      setEditLocation(compData.location);
      setEditDescription(compData.description);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingEdit(true);
    try {
      const payload: EditComplaintPayload = {
        title: editTitle.trim(),
        category: editCategory.trim(),
        location: editLocation.trim(),
        description: editDescription.trim(),
      };
      const updated = await complaintService.editComplaint(id, payload);
      setComplaint(updated);
      setIsEditing(false);
      success('Complaint Updated', 'Your modifications have been saved.');
    } catch (err) {
      error('Update Failed', formatApiErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelComplaint = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await complaintService.cancelComplaint(id);
      success('Complaint Cancelled', 'Your ticket has been marked cancelled.');
      setIsCancelModalOpen(false);
      loadData();
    } catch (err) {
      error('Unable to Cancel', formatApiErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-[#182444] rounded animate-pulse" />
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-2 text-xs text-[#8c9fc2] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Complaints</span>
        </Link>
        <ErrorBanner
          message={errorMsg || 'Complaint record could not be loaded.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  const isEligibleForEditOrCancel =
    complaint.status === 'submitted' || complaint.status === 'under_review';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-2 text-xs text-[#8c9fc2] hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Directory</span>
        </Link>

        {isEligibleForEditOrCancel && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#182444] hover:bg-cyan-500/20 text-xs font-medium text-cyan-300 border border-white/10 hover:border-cyan-400/30 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 border border-rose-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Ticket</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-card dash-card-glow p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 font-semibold tabular-nums">
              #{complaint.id}
            </span>
            <span className="text-xs text-[#617498]">·</span>
            <span className="text-xs text-[#8c9fc2] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#617498]" />
              <span className="tabular-nums">
                {new Date(complaint.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {complaint.title}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#8c9fc2] whitespace-pre-wrap leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-[#0a1024]/60 border border-white/5">
            <span className="text-[11px] text-[#617498] block mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span>Category</span>
            </span>
            <span className="font-semibold text-white">{complaint.category}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1024]/60 border border-white/5">
            <span className="text-[11px] text-[#617498] block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location</span>
            </span>
            <span className="font-semibold text-white truncate block">{complaint.location}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1024]/60 border border-white/5">
            <span className="text-[11px] text-[#617498] block mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Department</span>
            </span>
            <span className="font-semibold text-white truncate block">
              {complaint.department_name || 'Pending assignment'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1024]/60 border border-white/5">
            <span className="text-[11px] text-[#617498] block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Assigned Staff</span>
            </span>
            <span className="font-semibold text-white truncate block">
              {complaint.assigned_staff_name || 'Unassigned'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Autonomous AI Triage Assessment (if present) */}
      {complaint.triage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card dash-card-glow p-6 border-violet-500/25 bg-gradient-to-br from-[#1b1c44]/50 to-[#121c38]/90 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-violet-200">Autonomous AI Triage Assessment</h3>
          </div>
          <p className="text-xs text-[#c4d1e6] leading-relaxed">
            {complaint.triage.summary ||
              'Automated classification assigned recommended routing and priority.'}
          </p>
          {complaint.triage.urgency_reason && (
            <div className="text-xs text-violet-300 font-mono bg-[#090e21]/70 p-3 rounded-xl border border-violet-500/20">
              Urgency Evaluation: {complaint.triage.urgency_reason}
            </div>
          )}
        </motion.div>
      )}

      {/* Complaint Progress Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-card dash-card-glow p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Official Case Progress Timeline</h2>
              <p className="text-xs text-[#8c9fc2]">Verified status updates and staff resolution logs</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
            {updates.length} {updates.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>

        {updates.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0a1024]/60 border border-white/5 text-xs text-[#8c9fc2]">
            No progress entries recorded yet. Updates posted by assigned department staff will appear here.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {updates.map((upd, idx) => (
              <div key={upd.id || idx} className="relative">
                {/* Node icon */}
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#090e21] border-2 border-cyan-400 flex items-center justify-center shadow-xs shadow-cyan-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                <div className="p-4 rounded-xl bg-[#0a1024]/70 border border-white/10 space-y-1.5 hover:border-cyan-500/20 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      {upd.status ? `Status changed to: ${upd.status.replace(/_/g, ' ')}` : 'Progress Update'}
                    </span>
                    <span className="text-[11px] text-[#617498] font-mono tabular-nums">
                      {new Date(upd.created_at).toLocaleString()}
                    </span>
                  </div>
                  {upd.message && (
                    <p className="text-xs text-[#8c9fc2] leading-relaxed">{upd.message}</p>
                  )}
                  {upd.user_name && (
                    <div className="text-[10px] text-cyan-300/80 font-mono pt-1">
                      Officer: {upd.user_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Edit Complaint Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121c38] border border-white/15 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-[#8c9fc2] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">Edit Complaint Information</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8c9fc2] mb-1">Title</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={150}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0a1024] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8c9fc2] mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-[#0a1024] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8c9fc2] mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-[#0a1024] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8c9fc2] mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#0a1024] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#8c9fc2] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#090e21] hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancel This Complaint?"
        message="Cancelling will mark the ticket as cancelled on the university server. You can only cancel tickets that have not yet reached field execution."
        confirmLabel="Cancel Complaint"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleCancelComplaint}
        onCancel={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
