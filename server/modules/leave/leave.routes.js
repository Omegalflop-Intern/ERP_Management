import { Router } from 'express';
import * as leaveController from './leave.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createLeaveSchema, updateLeaveStatusSchema } from './leave.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', leaveController.getAllLeaves);
router.get('/employee/:employeeId', leaveController.getEmployeeLeaves);
router.post('/', validate(createLeaveSchema), leaveController.createLeave);
router.put('/:id/status', authorize('ADMIN', 'MANAGER'), validate(updateLeaveStatusSchema), leaveController.updateLeaveStatus);
router.delete('/:id', leaveController.deleteLeave);

export default router;
