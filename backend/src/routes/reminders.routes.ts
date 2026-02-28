import { Router } from 'express';
import { getReminders, sendWhatsappReminder } from '../controllers/reminders.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.use(authenticate);
router.get('/', getReminders);
router.post('/whatsapp/:id', sendWhatsappReminder);
export default router;
