import { Router } from 'express';
import * as roleController from './role.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createRoleSchema, updateRoleSchema } from './role.validator.js';

const router = Router();

router.use(authenticate);

router.get('/permissions', roleController.getPermissions);
router.get('/flat', roleController.getAllRolesFlat);
router.get('/', authorize('ADMIN'), roleController.getAllRoles);
router.get('/:id', authorize('ADMIN'), roleController.getRoleById);
router.post('/', authorize('ADMIN'), validate(createRoleSchema), roleController.createRole);
router.put('/:id', authorize('ADMIN'), validate(updateRoleSchema), roleController.updateRole);
router.delete('/:id', authorize('ADMIN'), roleController.deleteRole);

export default router;
