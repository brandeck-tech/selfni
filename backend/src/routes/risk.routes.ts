import { Router } from 'express';
import { getClientsRisk } from '../controllers/risk.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.use(authenticate);
router.get('/clients', getClientsRisk);
export default router;
