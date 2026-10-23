import { apiClient } from './apiClient';
import { FollowupApproval, RecommendedAction, ApprovalStatus } from '../types';

export interface CreateApprovalPayload {
  complaint_id: string;
  recommended_action: RecommendedAction;
  reason: string;
}

export interface ReviewApprovalPayload {
  decision: 'approved' | 'rejected';
}

export const approvalService = {
  getApprovals: async (): Promise<FollowupApproval[]> => {
    const res = await apiClient.get<FollowupApproval[] | { approvals: FollowupApproval[] }>(
      '/followup-approvals'
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).approvals)) return (res as any).approvals;
    return [];
  },

  createApproval: async (payload: CreateApprovalPayload): Promise<FollowupApproval> => {
    return apiClient.post<FollowupApproval>('/followup-approvals', payload);
  },

  reviewApproval: async (approvalId: string, decision: 'approved' | 'rejected'): Promise<any> => {
    return apiClient.patch(`/followup-approvals/${encodeURIComponent(approvalId)}`, {
      decision,
    });
  },
};
