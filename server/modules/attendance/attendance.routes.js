import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { checkInSchema, checkOutSchema, updateAttendanceSchema } from './attendance.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/report', attendanceController.getAttendanceReport);
router.get('/today/:employeeId', attendanceController.getTodayStatus);
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateAttendanceSchema), attendanceController.updateAttendance);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), attendanceController.deleteAttendance);

export default router;
