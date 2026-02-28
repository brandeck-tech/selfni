import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getPayments = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const debt = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (debt.rows.length === 0) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const payments = await query('SELECT * FROM debt_payments WHERE debt_id=$1 ORDER BY created_at DESC', [id]);
    const paid = payments.rows.reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
    const total = parseFloat(debt.rows[0].amount);
    return res.json({ status: 'success', debt: debt.rows[0], payments: payments.rows, summary: { total, paid, remaining: total - paid } });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, note } = req.body;
  if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ status: 'error', message: 'المبلغ مطلوب' });
  try {
    const debt = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (debt.rows.length === 0) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const payment = await query('INSERT INTO debt_payments (debt_id, amount, note) VALUES ($1,$2,$3) RETURNING *', [id, amount, note]);
    const payments = await query('SELECT * FROM debt_payments WHERE debt_id=$1', [id]);
    const totalPaid = payments.rows.reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
    if (totalPaid >= parseFloat(debt.rows[0].amount)) {
      await query('UPDATE debts SET is_paid=true, paid_at=NOW() WHERE id=$1', [id]);
    }
    return res.json({ status: 'success', payment: payment.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};
