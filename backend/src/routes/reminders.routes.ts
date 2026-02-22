import { Router } from 'express';
import { getReminders } from '../controllers/reminders.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authenticate, getReminders);

export default router;
