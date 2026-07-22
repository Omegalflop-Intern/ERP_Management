import { Router } from 'express';
import * as expenseController from './expense.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', expenseController.getAllExpenses);
router.get('/categories', expenseController.getExpenseCategories);
router.post('/', authorize('ADMIN', 'MANAGER'), expenseController.createExpense);
router.delete('/:id', authorize('ADMIN'), expenseController.deleteExpense);

export default router;
