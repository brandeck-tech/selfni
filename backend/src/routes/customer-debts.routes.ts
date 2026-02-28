import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/connection';

const router = Router();
router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, type, amount, description, due_date } = req.body;
    const user_id = req.user!.id;
    if (!customer_id || !type || !amount) {
      return res.status(400).json({ success: false, message: 'customer_id والنوع والمبلغ مطلوبين' });
    }
    const customerCheck = await query('SELECT id, name FROM customers WHERE id=$1 AND user_id=$2', [customer_id, user_id]);
    if (customerCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    const customerName = customerCheck.rows[0].name;
    const result = await query(
      'INSERT INTO debts (user_id, customer_id, person_name, type, amount, remaining_amount, description, due_date, status) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8) RETURNING *',
      [user_id, customer_id, customerName, type, amount, description, due_date, 'active']
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e: any) {
    console.error('customerDebts POST error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const result = await query(`
      SELECT d.*, c.name as customer_name, c.phone as customer_phone, c.risk_category
      FROM debts d LEFT JOIN customers c ON d.customer_id=c.id
      WHERE d.user_id=$1 ORDER BY d.created_at DESC
    `, [user_id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
