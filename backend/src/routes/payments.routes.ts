import { Router } from 'express';
import { getPayments, addPayment } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/:id', getPayments);
router.post('/:id', addPayment);

export default router;
