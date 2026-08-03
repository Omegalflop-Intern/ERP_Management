import { Router } from 'express';
import * as customerController from './customer.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createCustomerSchema, updateCustomerSchema, collectDueSchema } from './customer.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/stats', customerController.getCustomerStats);
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/history', customerController.getCustomerHistory);
router.post('/', validate(createCustomerSchema), customerController.createCustomer);
router.post('/:id/collect-due', validate(collectDueSchema), customerController.collectDue);
router.put('/:id', validate(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', authorize('ADMIN'), customerController.deleteCustomer);

export default router;
