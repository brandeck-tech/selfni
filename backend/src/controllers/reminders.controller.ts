import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM debts WHERE user_id=$1 AND is_paid=false AND due_date IS NOT NULL
       AND due_date <= NOW() + INTERVAL '3 days'
       ORDER BY due_date ASC`,
      [req.user!.id]
    );
    return res.json({ status: 'success', reminders: result.rows });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};

export const sendWhatsappReminder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const d = result.rows[0];
    if (!d.phone) return res.status(400).json({ status: 'error', message: 'مفيش رقم تليفون' });
    const dueDate = new Date(d.due_date).toLocaleDateString('ar-EG');
    const msg = `مرحباً 👋\nهذا تذكير بموعد سداد مبلغ *${parseFloat(d.amount).toFixed(2)} جنيه*\nالموعد: ${dueDate}\nشكراً لك 🙏`;
    const phone = d.phone.replace(/^0/, '');
    const waUrl = `https://wa.me/2${phone}?text=${encodeURIComponent(msg)}`;
    return res.json({ status: 'success', whatsapp: waUrl, message: msg });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
};
