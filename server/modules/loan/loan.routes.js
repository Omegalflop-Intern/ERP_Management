import { Router } from 'express';
import * as loanController from './loan.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', loanController.getAllLoans);
router.get('/:id', loanController.getLoanById);
router.post('/', authorize('ADMIN', 'MANAGER'), loanController.createLoan);
router.post('/:id/repay', authorize('ADMIN', 'MANAGER'), loanController.repayLoanInstalment);
router.delete('/:id', authorize('ADMIN'), loanController.deleteLoan);

export default router;
