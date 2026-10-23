import React, { useEffect, useState, useCallback } from 'react';
import { userService, SetUserRolePayload } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { UserProfile, Department, UserRole } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  Users,
  Shield,
  Building2,
  Search,
  Check,
  Edit2,
  X,
  UserCheck,
  GraduationCap,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('student');
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [uList, dList] = await Promise.all([
        userService.getUsers(),
        departmentService.getDepartments().catch(() => []),
      ]);
      setUsers(uList);
      setDepartments(dList);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setTargetRole(user.role);
    setTargetDeptId(user.department_id || '');
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (targetRole === 'staff' && !targetDeptId) {
      error('Department Required', 'Staff accounts require a valid department assignment.');
      return;
    }

    setIsUpdatingRole(true);
    try {
      const payload: SetUserRolePayload = {
        role: targetRole,
        department_id: targetRole === 'staff' ? targetDeptId : null,
      };

      await userService.setUserRole(editingUser.id, payload);
      success(
        'Role Updated Successfully',
        `Assigned ${editingUser.full_name} to role "${targetRole}".`
      );
      setEditingUser(null);
      loadData();
    } catch (err) {
      error('Role Update Failed', formatApiErrorMessage(err));
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const studentCount = users.filter((u) => u.role === 'student').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Access Control & Personnel
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            User Directory & Roles
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage student registrations, assign department technicians, and configure administrator privileges.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          {users.length} Registered Accounts
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Students</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1 tabular-nums">{studentCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Campus complaint submitters</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Technician Staff</span>
            <div className="text-2xl font-bold text-cyan-300 mt-1 tabular-nums">{staffCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Department service personnel</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="dash-card dash-card-glow p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">System Administrators</span>
            <div className="text-2xl font-bold text-indigo-300 mt-1 tabular-nums">{adminCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Central operations directors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="dash-card dash-card-glow p-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name, email, or role..."
            className="w-full bg-[#0c142b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="dash-card dash-card-glow p-6">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No registered user profiles matched your criteria."
            action={{
              label: 'Reset Search',
              onClick: () => setSearchQuery(''),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 px-4">Email</th>
                  <th className="pb-3 px-4">Role</th>
                  <th className="pb-3 px-4">Department</th>
                  <th className="pb-3 px-4">Member Since</th>
                  <th className="pb-3 pl-4 text-right">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.full_name || 'Anonymous User'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                            : u.role === 'staff'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {u.department_name ? (
                        <span className="font-medium text-white">{u.department_name}</span>
                      ) : u.role === 'staff' ? (
                        <span className="text-amber-400 italic">Unassigned</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-3 py-1.5 rounded-lg bg-[#14203e] hover:bg-[#1b2b52] border border-cyan-500/20 text-cyan-300 font-medium text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Role</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="dash-card dash-card-glow max-w-md w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Modify User Role</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c142b] border border-white/5 space-y-1">
                <p className="text-xs font-semibold text-white">{editingUser.full_name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{editingUser.email}</p>
              </div>

              <form onSubmit={handleSaveRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                    className="w-full bg-[#0c142b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-400/60 transition-all"
                  >
                    <option value="student" className="bg-[#0b1328]">Student (Intake & Tracking)</option>
                    <option value="staff" className="bg-[#0b1328]">Staff / Technician (Work Queue)</option>
                    <option value="admin" className="bg-[#0b1328]">Administrator (Full Operations)</option>
                  </select>
                </div>

                {targetRole === 'staff' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Assigned Department
                    </label>
                    <select
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      required={targetRole === 'staff'}
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
                )}

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRole}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#090e21] font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
                  >
                    {isUpdatingRole ? 'Saving...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
