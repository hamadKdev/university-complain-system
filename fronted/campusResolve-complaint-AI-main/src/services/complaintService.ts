import { apiClient } from './apiClient';
import { Complaint, ComplaintUpdate } from '../types';

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category: string;
  location: string;
}

export interface EditComplaintPayload {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
}

export interface UpdateStatusPayload {
  status: string;
  message?: string;
}

export const complaintService = {
  createComplaint: async (payload: CreateComplaintPayload): Promise<Complaint> => {
    return apiClient.post<Complaint>('/complaints', payload);
  },

  getComplaints: async (status?: string): Promise<Complaint[]> => {
    const endpoint = status ? `/complaints?status=${encodeURIComponent(status)}` : '/complaints';
    const res = await apiClient.get<Complaint[] | { complaints: Complaint[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).complaints)) return (res as any).complaints;
    return [];
  },

  getComplaint: async (cid: string): Promise<Complaint> => {
    return apiClient.get<Complaint>(`/complaints/${encodeURIComponent(cid)}`);
  },

  editComplaint: async (cid: string, payload: EditComplaintPayload): Promise<Complaint> => {
    return apiClient.patch<Complaint>(`/complaints/${encodeURIComponent(cid)}`, payload);
  },

  cancelComplaint: async (cid: string): Promise<{ message?: string; status?: string }> => {
    return apiClient.delete<{ message?: string; status?: string }>(`/complaints/${encodeURIComponent(cid)}`);
  },

  updateStatus: async (cid: string, payload: UpdateStatusPayload): Promise<any> => {
    return apiClient.patch(`/complaints/${encodeURIComponent(cid)}/status`, payload);
  },

  getUpdates: async (cid: string): Promise<ComplaintUpdate[]> => {
    const res = await apiClient.get<ComplaintUpdate[] | { updates: ComplaintUpdate[] }>(
      `/complaints/${encodeURIComponent(cid)}/updates`
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).updates)) return (res as any).updates;
    return [];
  },

  addUpdate: async (cid: string, payload: UpdateStatusPayload): Promise<ComplaintUpdate> => {
    return apiClient.post<ComplaintUpdate>(`/complaints/${encodeURIComponent(cid)}/updates`, payload);
  },
};
