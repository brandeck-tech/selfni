import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE user_id=$1 ORDER BY risk_score ASC, created_at DESC',
      [req.user!.id]
    );
    return res.json({ status: 'success', customers: result.rows });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name) return res.status(400).json({ status: 'error', message: 'الاسم مطلوب' });
  try {
    const result = await query(
      'INSERT INTO customers (user_id, name, phone, email, address, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user!.id, name, phone, email, address, notes]
    );
    return res.status(201).json({ status: 'success', customer: result.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};

export const updateCustomerRisk = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const debtsRes = await query(
      'SELECT * FROM debts WHERE customer_id=$1 OR (user_id=$2 AND person_name=(SELECT name FROM customers WHERE id=$1))',
      [id, req.user!.id]
    );
    const debts = debtsRes.rows;
    const total = debts.length;
    const paid = debts.filter((d: any) => d.is_paid).length;
    const overdue = debts.filter((d: any) => !d.is_paid && d.due_date && new Date(d.due_date) < new Date()).length;
    const late = debts.filter((d: any) => d.is_paid && d.paid_at && d.due_date && new Date(d.paid_at) > new Date(d.due_date)).length;
    
    let score = 100;
    if (total > 0) {
      score -= (overdue / total) * 40;
      score -= late * 8;
      score += (paid / total) * 20;
    }
    score = Math.round(Math.max(0, Math.min(100, score)));
    
    const category = score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : score >= 40 ? 'متوسط' : score >= 20 ? 'ضعيف' : 'خطر';
    const totalBorrowed = debts.filter((d: any) => d.type === 'lend').reduce((s: number, d: any) => s + parseFloat(d.amount), 0);
    const totalRepaid = debts.filter((d: any) => d.type === 'lend' && d.is_paid).reduce((s: number, d: any) => s + parseFloat(d.amount), 0);
    const totalPending = debts.filter((d: any) => d.type === 'lend' && !d.is_paid).reduce((s: number, d: any) => s + parseFloat(d.amount), 0);
    const totalOverdue = debts.filter((d: any) => !d.is_paid && d.due_date && new Date(d.due_date) < new Date()).reduce((s: number, d: any) => s + parseFloat(d.amount), 0);

    await query(
      'UPDATE customers SET risk_score=$1, risk_category=$2, total_borrowed=$3, total_repaid=$4, total_pending=$5, total_overdue=$6, updated_at=NOW() WHERE id=$7',
      [score, category, totalBorrowed, totalRepaid, totalPending, totalOverdue, id]
    );
    return res.json({ status: 'success', score, category });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};
