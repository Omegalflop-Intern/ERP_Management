import { Router } from 'express';
import * as loanController from './loan.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createLoanSchema, repayLoanSchema } from './loan.validator.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', loanController.getAllLoans);
router.get('/:id', loanController.getLoanById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createLoanSchema), loanController.createLoan);
router.post('/:id/repay', authorize('ADMIN', 'MANAGER'), validate(repayLoanSchema), loanController.repayLoanInstalment);
router.delete('/:id', authorize('ADMIN'), loanController.deleteLoan);

export default router;
