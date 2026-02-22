import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'\;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
};

export const debts = {
  getAll: () => api.get('/debts'),
  add: (data: any) => api.post('/debts', data),
  markPaid: (id: number) => api.patch(`/debts/${id}/pay`),
  delete: (id: number) => api.delete(`/debts/${id}`),
  share: (id: number) => api.post(`/shares/debt/${id}`),
};

export const groups = {
  getAll: () => api.get('/groups'),
  create: (data: any) => api.post('/groups', data),
  payRound: (memberId: number) => api.patch(`/groups/members/${memberId}/pay`),
};

export const downloadPDF = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL.replace('/api', '')}/api/pdf/report`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selfni-report.pdf';
  a.click();
  window.URL.revokeObjectURL(url);
};

export default api;
