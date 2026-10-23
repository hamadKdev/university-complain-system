import { apiClient } from './apiClient';

export interface AssignmentPayload {
  complaint_id: string;
  staff_id: string;
  department_id: string;
}

export const assignmentService = {
  assignComplaint: async (payload: AssignmentPayload): Promise<any> => {
    return apiClient.post('/assignments', payload);
  },
};
