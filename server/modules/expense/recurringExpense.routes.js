import { Router } from 'express';
import * as recurringExpenseController from './recurringExpense.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', recurringExpenseController.getAllRecurringExpenses);
router.post('/', authorize('ADMIN', 'MANAGER'), recurringExpenseController.createRecurringExpense);
router.post('/process', authorize('ADMIN', 'MANAGER'), recurringExpenseController.processRecurringExpenses);
router.put('/:id', authorize('ADMIN', 'MANAGER'), recurringExpenseController.updateRecurringExpense);
router.delete('/:id', authorize('ADMIN'), recurringExpenseController.deleteRecurringExpense);

export default router;
