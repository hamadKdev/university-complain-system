import React, { useEffect, useState, useCallback } from 'react';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { Department, UserProfile } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatApiErrorMessage } from '../../services/apiClient';
import {
  Building2,
  Users,
  ShieldAlert,
  Info,
  Layers,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

export const DepartmentOverviewPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [deptList, userList] = await Promise.all([
        departmentService.getDepartments(),
        userService.getUsers().catch(() => []),
      ]);
      setDepartments(deptList);
      setUsers(userList);
    } catch (err) {
      setErrorMsg(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStaffForDept = (deptId: string) => {
    return users.filter((u) => u.department_id === deptId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            University Structure
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Operational Departments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered campus faculties, facility teams, and specialized dispatch units.
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 rounded-xl">
          {departments.length} Active Departments
        </div>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments available"
          description="No operational departments were found in the database."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, index) => {
            const staffMembers = getStaffForDept(dept.id);

            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="dash-card dash-card-glow p-6 sm:p-7 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      ID: #{dept.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-4 tracking-tight">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {dept.description || 'General university operational dispatch and maintenance.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Assigned Technicians</span>
                    </span>
                    <span className="font-bold text-white tabular-nums">
                      {staffMembers.length} staff
                    </span>
                  </div>

                  {staffMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {staffMembers.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="text-[11px] font-medium text-slate-300 bg-[#0c142b] border border-white/5 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                        >
                          {s.full_name}
                        </span>
                      ))}
                      {staffMembers.length > 3 && (
                        <span className="text-[11px] text-slate-400 px-1 py-0.5">
                          +{staffMembers.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-400 italic">
                      No technicians currently mapped. Assign staff in User Directory.
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
