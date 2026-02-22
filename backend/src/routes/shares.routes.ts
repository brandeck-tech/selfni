import { Router } from 'express';
import { shareDebt, viewSharedDebt } from '../controllers/shares.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.get('/:token', viewSharedDebt);
router.post('/debt/:id', authenticate, shareDebt);

export default router;
