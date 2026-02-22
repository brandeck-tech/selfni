import { Response } from 'express';
import { query } from '../database/config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDebts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM debts WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    const total_lend = result.rows.filter(d => d.type === 'lend' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
    const total_borrow = result.rows.filter(d => d.type === 'borrow' && !d.is_paid).reduce((s, d) => s + parseFloat(d.amount), 0);
    return res.json({ status: 'success', debts: result.rows, summary: { total_lend, total_borrow, net: total_lend - total_borrow } });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const addDebt = async (req: AuthRequest, res: Response) => {
  const { person_name, amount, type, description, due_date } = req.body;
  if (!person_name || !amount || !type) {
    return res.status(400).json({ status: 'error', message: 'الاسم والمبلغ والنوع مطلوبين' });
  }
  try {
    const result = await query(
      'INSERT INTO debts (user_id, person_name, amount, type, description, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user!.id, person_name, amount, type, description, due_date]
    );
    return res.status(201).json({ status: 'success', debt: result.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE debts SET is_paid=true, paid_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'الدين مش موجود' });
    }
    return res.json({ status: 'success', debt: result.rows[0] });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};

export const deleteDebt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    return res.json({ status: 'success', message: 'اتمسح' });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};
