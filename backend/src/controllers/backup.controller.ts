import { Response } from 'express';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const debtsRes = await query('SELECT * FROM debts WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]);
    const paymentsRes = await query('SELECT dp.* FROM debt_payments dp JOIN debts d ON dp.debt_id=d.id WHERE d.user_id=$1 ORDER BY dp.created_at DESC', [req.user!.id]);
    const userRes = await query('SELECT username, email, created_at FROM users WHERE id=$1', [req.user!.id]);

    const data = {
      exported_at: new Date().toISOString(),
      user: userRes.rows[0],
      summary: {
        total_debts: debtsRes.rows.length,
        total_lend: debtsRes.rows.filter((d:any) => d.type === 'lend').reduce((s:number, d:any) => s + parseFloat(d.amount), 0),
        total_borrow: debtsRes.rows.filter((d:any) => d.type === 'borrow').reduce((s:number, d:any) => s + parseFloat(d.amount), 0),
      },
      debts: debtsRes.rows,
      payments: paymentsRes.rows,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=selfni-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'خطأ في التصدير' });
  }
};
