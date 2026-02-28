import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { query } from '../config/connection';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();
router.use(authenticate);

router.get('/debt/:debtId', async (req: AuthRequest, res: Response) => {
  const { debtId } = req.params;
  try {
    const debtCheck = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [debtId, req.user!.id]);
    if (debtCheck.rows.length === 0) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const result = await query('SELECT * FROM installments WHERE debt_id=$1 ORDER BY installment_number ASC', [debtId]);
    const paid = result.rows.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + parseFloat(i.paid_amount || 0), 0);
    const pending = result.rows.filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + parseFloat(i.amount), 0);
    return res.json({ status: 'success', installments: result.rows, summary: { paid, pending, total: paid + pending } });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
});

router.post('/debt/:debtId', async (req: AuthRequest, res: Response) => {
  const { debtId } = req.params;
  const { count, start_date } = req.body;
  if (!count || count < 2) return res.status(400).json({ status: 'error', message: 'عدد الأقساط لازم 2 على الأقل' });
  try {
    const debtCheck = await query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [debtId, req.user!.id]);
    if (debtCheck.rows.length === 0) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const debt = debtCheck.rows[0];
    const installmentAmount = (parseFloat(debt.amount) / count).toFixed(2);
    const startDate = new Date(start_date || Date.now());
    await query('DELETE FROM installments WHERE debt_id=$1', [debtId]);
    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      await query(
        'INSERT INTO installments (debt_id, installment_number, amount, due_date, status) VALUES ($1,$2,$3,$4,$5)',
        [debtId, i, installmentAmount, dueDate.toISOString().split('T')[0], 'pending']
      );
    }
    const result = await query('SELECT * FROM installments WHERE debt_id=$1 ORDER BY installment_number ASC', [debtId]);
    return res.status(201).json({ status: 'success', installments: result.rows });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
});

router.patch('/:id/pay', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const inst = await query('SELECT i.*, d.user_id FROM installments i JOIN debts d ON i.debt_id=d.id WHERE i.id=$1', [id]);
    if (inst.rows.length === 0 || inst.rows[0].user_id !== req.user!.id) return res.status(404).json({ status: 'error', message: 'مش موجود' });
    const result = await query(
      'UPDATE installments SET status=$1, paid_amount=$2, paid_at=NOW() WHERE id=$3 RETURNING *',
      ['paid', inst.rows[0].amount, id]
    );
    return res.json({ status: 'success', installment: result.rows[0] });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'خطأ' });
  }
});

export default router;
