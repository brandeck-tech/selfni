import { Router } from 'express';
import { shareDebt, viewSharedDebt, confirmDebt } from '../controllers/shares.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.post('/debt/:id', authenticate, shareDebt);
router.get('/:token', viewSharedDebt);
router.get('/confirm/:token', confirmDebt);

export default router;
