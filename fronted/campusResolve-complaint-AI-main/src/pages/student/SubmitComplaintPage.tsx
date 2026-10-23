import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import { Complaint } from '../../types';
import {
  FileText,
  MapPin,
  Tag,
  AlignLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COMMON_CATEGORIES = [
  'Electrical',
  'HVAC & Air Conditioning',
  'Plumbing',
  'IT & Network Infrastructure',
  'Classroom Projectors & Audio',
  'Laboratory Equipment',
  'Sanitation & Cleanliness',
  'Campus Security & Access',
  'Hostel Facilities',
  'Library Resources',
];

export const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedCategory = category === 'Other' ? customCategory : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanTitle = title.trim();
    const cleanCat = selectedCategory.trim();
    const cleanLoc = location.trim();
    const cleanDesc = description.trim();

    if (cleanTitle.length < 5 || cleanTitle.length > 150) {
      setValidationError('Title must be between 5 and 150 characters.');
      return;
    }
    if (!cleanCat || cleanCat.length < 2 || cleanCat.length > 80) {
      setValidationError('Please select or specify a category (2-80 characters).');
      return;
    }
    if (cleanLoc.length < 2 || cleanLoc.length > 200) {
      setValidationError('Location must be between 2 and 200 characters.');
      return;
    }
    if (cleanDesc.length < 10 || cleanDesc.length > 3000) {
      setValidationError('Description must be between 10 and 3,000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await complaintService.createComplaint({
        title: cleanTitle,
        category: cleanCat,
        location: cleanLoc,
        description: cleanDesc,
      });

      setCreatedComplaint(result);
      success('Ticket Submitted Successfully', `Tracking ID: #${result.id.slice(0, 8)}`);
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setValidationError(msg);
      error('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
          Student Intake
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
          File Campus Complaint
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Submit equipment faults, facility breakdowns, or campus issues for autonomous AI triage.
        </p>
      </div>

      <AnimatePresence>
        {createdComplaint ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dash-card dash-card-glow p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-white">Complaint Submitted to Central Queue</h2>
              <p className="text-xs text-slate-300">
                Your incident has been recorded and assigned tracking ID{' '}
                <strong className="text-cyan-400 font-mono">#{createdComplaint.id.slice(0, 8)}</strong>.
                AI triage is categorizing urgency for department staff dispatch.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/student/complaints/${createdComplaint.id}`)}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all inline-flex items-center gap-2"
              >
                <span>Track Ticket Progress</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCreatedComplaint(null);
                  setTitle('');
                  setCategory('');
                  setLocation('');
                  setDescription('');
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
              >
                File Another Complaint
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="dash-card dash-card-glow lg:col-span-8 p-6 sm:p-8">
              {validationError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-relaxed">{validationError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="title">
                    Complaint Title <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="title"
                      type="text"
                      required
                      minLength={5}
                      maxLength={150}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="E.g., Library 3rd Floor HVAC Malfunction or Projector Lamp Blinking"
                      className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all shadow-inner"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-right mt-1 tabular-nums">
                    {title.length}/150
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="category">
                      Category <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="category"
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                      >
                        <option value="" disabled>Select Category</option>
                        {COMMON_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-[#0b1328]">
                            {cat}
                          </option>
                        ))}
                        <option value="Other" className="bg-[#0b1328]">Other (Custom)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="location">
                      Campus Location <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="location"
                        type="text"
                        required
                        minLength={2}
                        maxLength={200}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="E.g., Building C, Room 304"
                        className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {category === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Specify Custom Category <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="E.g., Sports Complex Lockers"
                      className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="description">
                    Description & Details <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, symptoms, safety concerns, and urgency..."
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-1 tabular-nums">
                    {description.length}/3,000
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-[#090e21] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Grievance to Dispatch</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Information Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="dash-card dash-card-glow p-6 space-y-3.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Autonomous Triage</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  How CampusResolve AI Dispatches Your Case
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upon submission, our connected n8n classification agent analyzes category and urgency, matching it to the on-duty department technician.
                </p>
                <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time tracking timeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Direct technician progress notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Cancellation rights while pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
