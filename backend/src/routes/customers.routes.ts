import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomerRisk } from '../controllers/customers.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.use(authenticate);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id/risk', updateCustomerRisk);
export default router;
