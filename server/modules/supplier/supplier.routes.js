import { Router } from 'express';
import * as supplierController from './supplier.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.get('/:id/stats', supplierController.getSupplierStats);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createSupplierSchema), supplierController.createSupplier);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', authorize('ADMIN'), supplierController.deleteSupplier);

export default router;
