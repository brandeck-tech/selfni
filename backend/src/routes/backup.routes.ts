import { Router } from 'express';
import { exportData } from '../controllers/backup.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.use(authenticate);
router.get('/export', exportData);
export default router;
