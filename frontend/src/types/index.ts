// ===== Frontend Types =====

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Debt {
  id: number;
  person_name: string;
  amount: number;
  type: 'lend' | 'borrow';
  description?: string;
  due_date?: string;
  is_paid: boolean;
  phone?: string;
  created_at: string;
  paid_amount?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  risk_score: number;
  risk_category: string;
  total_borrowed: number;
  total_pending: number;
  total_overdue: number;
}

export interface Installment {
  id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_amount: number;
}

export interface Payment {
  id: number;
  amount: number;
  note?: string;
  created_at: string;
}

export type PageName = 'home' | 'add' | 'clients' | 'customers' | 'dashboard' | 'settings' | 'debt';
