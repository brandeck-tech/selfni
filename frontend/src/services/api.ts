// ===== API Service =====
const BASE = 'http://localhost:3003/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export const api = {
  get: (endpoint: string) =>
    fetch(`${BASE}${endpoint}`, { headers: headers() }).then(r => r.json()),

  post: (endpoint: string, body: any) =>
    fetch(`${BASE}${endpoint}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),

  patch: (endpoint: string, body?: any) =>
    fetch(`${BASE}${endpoint}`, { method: 'PATCH', headers: headers(), body: body ? JSON.stringify(body) : undefined }).then(r => r.json()),

  delete: (endpoint: string) =>
    fetch(`${BASE}${endpoint}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),
};

// ===== Debt API =====
export const debtApi = {
  getAll: () => api.get('/debts'),
  getById: (id: number) => api.get(`/debts/${id}`),
  create: (data: any) => api.post('/debts', data),
  markPaid: (id: number) => api.patch(`/debts/${id}/pay`),
  getPayments: (id: number) => api.get(`/debts/${id}/payments`),
  addPayment: (id: number, data: any) => api.post(`/debts/${id}/payments`, data),
};

// ===== Customer API =====
export const customerApi = {
  getAll: () => api.get('/customers'),
  create: (data: any) => api.post('/customers', data),
  getRisk: () => api.get('/risk/clients'),
};

// ===== Installment API =====
export const installmentApi = {
  getByDebt: (debtId: number) => api.get(`/installments/debt/${debtId}`),
  create: (debtId: number, data: any) => api.post(`/installments/debt/${debtId}`, data),
  pay: (id: number) => api.patch(`/installments/${id}/pay`),
};

// ===== Auth API =====
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
};
