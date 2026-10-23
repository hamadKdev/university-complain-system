import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { AppShell } from './components/layout/AppShell';
import { RoleGuard } from './components/layout/RoleGuard';

// Student
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubmitComplaintPage } from './pages/student/SubmitComplaintPage';
import { MyComplaintsPage } from './pages/student/MyComplaintsPage';
import { ComplaintDetailPage } from './pages/student/ComplaintDetailPage';

// Staff
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffQueuePage } from './pages/staff/StaffQueuePage';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { FollowupApprovalsPage } from './pages/admin/FollowupApprovalsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentOverviewPage } from './pages/admin/DepartmentOverviewPage';

// Shared
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const RootRoute: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080D1B] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-[#A7B4CC] tracking-wide uppercase font-semibold">
          Verifying Session...
        </p>
      </div>
    );
  }

  if (isAuthenticated && role) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'staff') return <Navigate to="/staff" replace />;
    if (role === 'student') return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Root Entry: Show login unless valid authenticated session exists */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Authenticated Application Shell */}
      <Route element={<AppShell />}>
        {/* Student Routes */}
        <Route element={<RoleGuard allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/submit" element={<SubmitComplaintPage />} />
          <Route path="/student/complaints" element={<MyComplaintsPage />} />
          <Route path="/student/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>

        {/* Staff Routes */}
        <Route element={<RoleGuard allowedRoles={['staff']} />}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/queue" element={<StaffQueuePage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
          <Route path="/admin/approvals" element={<FollowupApprovalsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/departments" element={<DepartmentOverviewPage />} />
        </Route>

        {/* Common Authenticated Routes */}
        <Route element={<RoleGuard />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
