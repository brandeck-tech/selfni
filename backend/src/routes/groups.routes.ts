import { Router } from 'express';
import { getGroups, createGroup, payRound } from '../controllers/groups.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getGroups);
router.post('/', createGroup);
router.patch('/members/:memberId/pay', payRound);

export default router;
