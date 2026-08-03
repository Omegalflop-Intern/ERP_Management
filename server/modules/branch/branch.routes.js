import { Router } from 'express';
import * as branchController from './branch.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createBranchSchema, updateBranchSchema } from './branch.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/flat', branchController.getAllBranchesFlat);
router.get('/', authorize('ADMIN', 'MANAGER'), branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', authorize('ADMIN'), validate(createBranchSchema), branchController.createBranch);
router.put('/:id', authorize('ADMIN'), validate(updateBranchSchema), branchController.updateBranch);
router.delete('/:id', authorize('ADMIN'), branchController.deleteBranch);

export default router;
