import axios from 'axios';

// Backend Spring Boot REST API Base URL
const API_BASE_URL = 'http://localhost:8080/api/complaints';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const complaintService = {
  // READ: Fetch all complaints (Warden view)
  getAll: async () => {
    const response = await api.get('');
    return response.data;
  },

  // READ: Fetch single complaint by ID
  getById: async (id) => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  // READ: Student personal complaints by Roll No
  getByRollNo: async (rollNo) => {
    const response = await api.get(`/student/${encodeURIComponent(rollNo)}`);
    return response.data;
  },

  // CREATE: Submit new complaint (Student)
  create: async (complaintData) => {
    const response = await api.post('', complaintData);
    return response.data;
  },

  // UPDATE: Update full complaint details
  update: async (id, complaintData) => {
    const response = await api.put(`/${id}`, complaintData);
    return response.data;
  },

  // UPDATE: Change status & remarks (Warden / Staff resolve)
  updateStatus: async (id, status, remarks = '') => {
    const response = await api.patch(`/${id}/status`, { status, remarks });
    return response.data;
  },

  // ASSIGN: Assign technician / staff member (Warden)
  assignStaff: async (id, assignedStaff) => {
    const response = await api.patch(`/${id}/assign`, { assignedStaff });
    return response.data;
  },

  // DELETE: Remove complaint
  delete: async (id) => {
    const response = await api.delete(`/${id}`);
    return response.data;
  },

  // STATS: Get summary count
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
};

export default complaintService;
