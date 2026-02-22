import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
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

export default api;

export const downloadPDF = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:4000/api/pdf/report', {
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
