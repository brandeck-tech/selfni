import { Router } from 'express';
import { getDebts, addDebt, markAsPaid, deleteDebt } from '../controllers/debts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getDebts);
router.post('/', addDebt);
router.patch('/:id/pay', markAsPaid);
router.delete('/:id', deleteDebt);

export default router;
