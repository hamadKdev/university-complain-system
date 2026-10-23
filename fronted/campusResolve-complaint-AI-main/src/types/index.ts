export type UserRole = 'student' | 'staff' | 'admin';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected'
  | 'cancelled';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  department_name?: string | null;
  created_at?: string;
  avatar_url?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  student_id?: string;
  student_name?: string;
  department_id?: string | null;
  department_name?: string | null;
  assigned_to?: string | null;
  assigned_staff_name?: string | null;
  created_at: string;
  updated_at?: string;
  triage?: TriageResult | null;
}

export interface TriageResult {
  category?: string;
  priority?: PriorityLevel;
  department?: string;
  confidence?: number;
  summary?: string;
  urgency_reason?: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  status?: string;
  message?: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

export type RecommendedAction = 'none' | 'remind' | 'escalate';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface FollowupApproval {
  id: string;
  complaint_id: string;
  recommended_action: RecommendedAction;
  reason: string;
  status: ApprovalStatus;
  requested_by?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface AnalyticsData {
  total_complaints?: number;
  open_complaints?: number;
  in_progress?: number;
  resolved?: number;
  overdue?: number;
  by_category?: Record<string, number>;
  by_status?: Record<string, number>;
  by_priority?: Record<string, number>;
  by_department?: Record<string, number>;
  recent_activity?: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  detail?: string | ApiValidationError[];
  message?: string;
}
