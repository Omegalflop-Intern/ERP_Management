import express from 'express';
import * as tempAdminController from './tempAdmin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';

const router = express.Router();

router.use(authenticate, requireSuperAdmin);

router.get('/active', tempAdminController.getAllActiveTempAdmins);
router.post('/:id/temp-admin', tempAdminController.createTempAdmin);
router.get('/:id/temp-admin', tempAdminController.getShopTempAdmins);
router.delete('/:id/revoke', tempAdminController.revokeTempAdmin);

export default router;
