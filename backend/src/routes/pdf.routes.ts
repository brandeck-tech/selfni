import { Router } from 'express';
import { generatePDF, generateDebtReceipt, generateHTMLReceipt } from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/report', generatePDF);
router.get('/receipt/:id', generateDebtReceipt);
router.get('/receipt-html/:id', generateHTMLReceipt);

export default router;
