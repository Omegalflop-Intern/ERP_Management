import { Router } from 'express';
import * as expenseController from './expense.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createExpenseSchema, updateExpenseSchema } from './expense.validator.js';
import { uploadReceipt } from '../../config/upload.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', expenseController.getAllExpenses);
router.get('/categories', expenseController.getExpenseCategories);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createExpenseSchema), expenseController.createExpense);
router.post('/upload-receipts', authorize('ADMIN', 'MANAGER'), uploadReceipt, expenseController.uploadReceipts);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', authorize('ADMIN'), expenseController.deleteExpense);

export default router;
