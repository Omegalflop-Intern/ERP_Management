import { Router } from 'express';
import * as payrollController from './payroll.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { processPayrollSchema, updatePayrollSchema } from './payroll.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/summary', payrollController.getPayrollSummary);
router.get('/', payrollController.getAllPayroll);
router.get('/:id/payslip', payrollController.getPayslip);
router.post('/process', authorize('ADMIN', 'MANAGER'), validate(processPayrollSchema), payrollController.processPayroll);
router.put('/:id/pay', authorize('ADMIN', 'MANAGER'), payrollController.markAsPaid);
router.delete('/:id', authorize('ADMIN'), payrollController.deletePayroll);

export default router;
