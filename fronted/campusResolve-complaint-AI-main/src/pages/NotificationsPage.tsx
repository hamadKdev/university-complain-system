import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatApiErrorMessage } from '../services/apiClient';
import {
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (nid: string) => {
    try {
      await notificationService.markAsRead(nid, true);
      setNotifications((prev) =>
        prev.map((n) => (n.id === nid ? { ...n, is_read: true } : n))
      );
      success('Notification Updated', 'Marked as read.');
    } catch (err) {
      error('Failed to mark notification', formatApiErrorMessage(err));
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    try {
      await Promise.all(unread.map((n) => notificationService.markAsRead(n.id, true)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('All Read', 'Marked all notifications as read.');
    } catch (err) {
      error('Update Error', formatApiErrorMessage(err));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Notification Center</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold font-mono">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-[#8c9fc2] mt-1">
            Real-time notifications regarding AI triage, department assignments, and follow-up alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#182444] hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all border border-white/10 hover:border-cyan-400/30 text-xs font-semibold self-start sm:self-auto active:scale-95"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-[#8c9fc2] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-[#8c9fc2] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadNotifications} />}

      <div className="dash-card dash-card-glow p-5 sm:p-6">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : displayedNotifications.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description={
              filter === 'unread'
                ? 'You have caught up with all incoming system updates and notifications.'
                : 'When there is activity on your tickets or assigned queues, notices will appear here.'
            }
            icon={Bell}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayedNotifications.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    item.is_read
                      ? 'bg-[#0a1024]/40 border-white/5 text-[#8c9fc2]'
                      : 'bg-[#0a1024]/90 border-cyan-500/25 text-white shadow-sm shadow-cyan-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.is_read
                          ? 'bg-[#182444] text-[#617498]'
                          : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold truncate text-white">
                          {item.title || 'Complaint System Notification'}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#8c9fc2] mt-1 leading-relaxed break-words">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#617498] font-mono tabular-nums">
                        <Clock className="w-3 h-3 text-[#617498]" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition-all shrink-0 font-medium active:scale-95"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
