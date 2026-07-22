import { Router } from 'express';
import * as employeeController from './employee.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validator.js';

const router = Router();

router.use(authenticate);

router.get('/stats', employeeController.getEmployeeStats);
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', authorize('ADMIN'), employeeController.deleteEmployee);

export default router;
