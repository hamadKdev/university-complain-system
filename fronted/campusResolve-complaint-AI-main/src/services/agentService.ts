import { apiClient } from './apiClient';

export const agentService = {
  runTriage: async (cid: string): Promise<any> => {
    return apiClient.post(`/agents/triage/${encodeURIComponent(cid)}`);
  },

  runAssignmentAgent: async (cid: string): Promise<any> => {
    return apiClient.post(`/agents/assignment/${encodeURIComponent(cid)}`);
  },

  runFollowupAgent: async (complaintId: string): Promise<any> => {
    return apiClient.post('/agents/followup', { complaint_id: complaintId });
  },
};
