import { Response } from 'express';
import { query } from '../database/config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT *, 
        (due_date - CURRENT_DATE) as days_remaining
      FROM debts 
      WHERE user_id=$1 
        AND is_paid=false 
        AND due_date IS NOT NULL
        AND due_date >= CURRENT_DATE
      ORDER BY due_date ASC
    `, [req.user!.id]);

    const urgent = result.rows.filter(d => d.days_remaining <= 3);
    const upcoming = result.rows.filter(d => d.days_remaining > 3 && d.days_remaining <= 7);

    return res.json({ 
      status: 'success', 
      reminders: { urgent, upcoming, all: result.rows }
    });
  } catch {
    return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
  }
};
