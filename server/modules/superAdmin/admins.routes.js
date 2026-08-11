import { Router } from 'express';
import * as adminsController from './admins.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', adminsController.listSystemAdmins);
router.post('/', adminsController.createSystemAdmin);
router.patch('/:id', adminsController.updateSystemAdmin);
router.patch('/:id/toggle-active', adminsController.toggleAdminActive);
router.delete('/:id', adminsController.deleteSystemAdmin);

export default router;
