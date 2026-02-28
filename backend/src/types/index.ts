// ===== Backend Types =====

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Debt {
  id: number;
  user_id: number;
  customer_id?: number;
  person_name: string;
  amount: number;
  remaining_amount: number;
  type: 'lend' | 'borrow';
  description?: string;
  due_date?: string;
  is_paid: boolean;
  paid_at?: string;
  phone?: string;
  status: 'active' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  phone?: string;
  email?: string;
  risk_score: number;
  risk_category: string;
  total_borrowed: number;
  total_repaid: number;
  total_pending: number;
  total_overdue: number;
  created_at: string;
}

export interface Installment {
  id: number;
  debt_id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_amount: number;
  paid_at?: string;
}

export interface Payment {
  id: number;
  debt_id: number;
  amount: number;
  note?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}
